{
  "tokenizer": AutoTokenizer,
  "pipeline": AutomaticSpeechRecognitionPipeline,
  "model": AutoModelForSeq2SeqLM,
  "processor": AutoProcessor,
  "default": {
      "model": "openai/whisper-tiny.en"
  },
  "type": "multimodal",
}


class AutomaticSpeechRecognitionPipeline extends Pipeline {

  /**
   * Creates an instance of AutomaticSpeechRecognitionPipeline.
   * @param {string} task - The type of the task for this pipeline. Currently only "asr" is supported.
   * @param {object} tokenizer - The tokenizer to be used for pre-processing inputs.
   * @param {object} model - The model to be used for the task.
   * @param {object} processor - The processor to be used for pre-processing audio inputs.
   */
  constructor(task, tokenizer, model, processor) {
      super(task, tokenizer, model);
      this.processor = processor;
  }

  /**
   * Asynchronously processes audio and generates text transcription using the model.
   * @param {Array} audio - The audio to be transcribed. Can be a single Float32Array or an array of Float32Arrays.
   * @param {Object} [kwargs={}] - Optional arguments.
   * @param {boolean} [kwargs.return_timestamps] - Whether to return timestamps or not. Default is false.
   * @param {number} [kwargs.chunk_length_s] - The length of audio chunks to process in seconds. Default is 0 (no chunking).
   * @param {number} [kwargs.stride_length_s] - The length of overlap between consecutive audio chunks in seconds. If not provided, defaults to chunk_length_s / 6.
   * @param {function} [kwargs.chunk_callback] - Callback function to be called with each chunk processed.
   * @param {boolean} [kwargs.force_full_sequences] - Whether to force outputting full sequences or not. Default is false.
   * @returns {Promise<Object>} A Promise that resolves to an object containing the transcription text and optionally timestamps if return_timestamps is true.
   */
  async _call(audio, kwargs = {}) {
      let return_timestamps = kwargs.return_timestamps ?? false;
      let chunk_length_s = kwargs.chunk_length_s ?? 0;
      let stride_length_s = kwargs.stride_length_s ?? null;
      let chunk_callback = kwargs.chunk_callback ?? null;
      let force_full_sequences = kwargs.force_full_sequences ?? false;

      // TODO
      // task = 'transcribe',
      // language = 'en',

      let single = !Array.isArray(audio)
      if (single) {
          audio = [audio]
      }

      const sampling_rate = this.processor.feature_extractor.config.sampling_rate;
      const time_precision = this.processor.feature_extractor.config.chunk_length / this.model.config.max_source_positions;

      let toReturn = [];
      for (let aud of audio) {
          aud = await this._preprocess(aud, sampling_rate)

          /** @type {any[]} */
          let chunks = [];
          if (chunk_length_s > 0) {
              if (stride_length_s === null) {
                  stride_length_s = chunk_length_s / 6;
              } else if (chunk_length_s <= stride_length_s) {
                  throw Error("`chunk_length_s` must be larger than `stride_length_s`.")
              }

              // TODO support different stride_length_s (for left and right)

              const window = sampling_rate * chunk_length_s;
              const stride = sampling_rate * stride_length_s;
              const jump = window - 2 * stride;
              let offset = 0;

              // Create subarrays of audio with overlaps

              while (offset < aud.length) {
                  let subarr = aud.subarray(offset, offset + window);
                  let feature = await this.processor(subarr);

                  let isFirst = offset === 0;
                  let isLast = offset + jump >= aud.length;
                  chunks.push({
                      stride: [
                          subarr.length,
                          isFirst ? 0 : stride,
                          isLast ? 0 : stride
                      ],
                      input_features: feature.input_features,
                      is_last: isLast
                  })
                  offset += jump;
              }

          } else {
              chunks = [{
                  stride: [aud.length, 0, 0],
                  input_features: (await this.processor(aud)).input_features,
                  is_last: true
              }]
          }

          // Generate for each set of input features
          for (let chunk of chunks) {
              // NOTE: doing sequentially for now
              let data = await this.model.generate(chunk.input_features, kwargs);

              // Get top beam
              chunk.tokens = data[0].flat()

              // convert stride to seconds
              chunk.stride = chunk.stride.map(x => x / sampling_rate);

              if (chunk_callback !== null) {
                  chunk_callback(chunk)
              }
          }

          // Merge text chunks
          let [full_text, optional] = this.tokenizer._decode_asr(chunks, {
              time_precision: time_precision,
              return_timestamps: return_timestamps,
              force_full_sequences: force_full_sequences
          });

          toReturn.push({ text: full_text, ...optional })
      }
      return single ? toReturn[0] : toReturn;
  }
}
