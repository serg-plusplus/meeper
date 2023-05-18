import { memo, useEffect } from "react";
import useForceUpdate from "use-force-update";
import format from "date-fns/format";
import formatDistanceToNowStrict from "date-fns/formatDistanceToNowStrict";
import isToday from "date-fns/isToday";
import * as locales from "date-fns/locale";

type PrettyDateProps = {
  date: string | number;
};

const PrettyDate = memo<PrettyDateProps>(({ date }) => {
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    let t: any;

    const updateAndDefer = () => {
      forceUpdate();
      t = setTimeout(updateAndDefer, 5_000);
    };
    t = setTimeout(updateAndDefer, 5_000);

    return () => clearTimeout(t);
  }, [forceUpdate]);

  return <>{getPrettyDate(date)}</>;
});

export default PrettyDate;

const localeCode = chrome.i18n
  .getUILanguage()
  .replace("-", "")
  .replace("_", "");

export const getPrettyDate = (date: string | number) => {
  const preparedDate = new Date(date);

  const locale = (locales as any)[localeCode] ?? locales.enUS;

  if (isToday(preparedDate)) {
    return formatDistanceToNowStrict(preparedDate, { locale, addSuffix: true });
  }

  return format(preparedDate, "PP", { locale });
};
