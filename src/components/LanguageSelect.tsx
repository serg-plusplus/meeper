import * as React from "react";
import { ChevronsUpDown } from "lucide-react";

import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export default function LanguageSelect({
  selectedLangCode,
  langList,
  onLangSelected,
}: {
  selectedLangCode: string | undefined;
  langList: { code: string; name: string }[];
  onLangSelected: (code: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const langMap = React.useMemo(() => {
    return Object.fromEntries(langList.map(({ code, name }) => [code, name]));
  }, [langList]);

  const langFilter = React.useCallback(
    (code: string, search: string) => {
      if (search === "") return 1;

      search = search.toLowerCase();
      if (code.includes(search)) return 1;

      const name = langMap[code]?.toLowerCase();
      if (name?.includes(search)) return 1;

      return 0;
    },
    [langMap]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="xs"
          className="justify-between border-muted-foreground"
        >
          {selectedLangCode && selectedLangCode in langMap ? (
            <>{langMap[selectedLangCode]}</>
          ) : (
            <>Auto</>
          )}

          <ChevronsUpDown className="ml-1 -mr-2 h-3 w-3 shrink-0 opacity-75" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" side="bottom" align="end">
        <Command filter={langFilter}>
          <CommandInput placeholder="Change language..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {langList.map(({ code, name }) => (
                <CommandItem
                  key={code}
                  value={code}
                  onSelect={(newCode) => {
                    onLangSelected(newCode);
                    setOpen(false);
                  }}
                >
                  <span>{name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
