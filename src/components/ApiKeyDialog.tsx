import {
  PropsWithChildren,
  Dispatch,
  SetStateAction,
  createContext,
  useState,
  useContext,
  useEffect,
} from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  // DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

import { getOpenAiApiKey } from "../core/openaiApiKey";

export type ApiKeyDialogState = [boolean, Dispatch<SetStateAction<boolean>>];

const apiKeyDialogCtx = createContext<ApiKeyDialogState | null>(null);

export const useApiKeyDialog = () => useContext(apiKeyDialogCtx)!;

export function ApiKeyDialogProvider({ children }: PropsWithChildren) {
  const ctxState = useState<boolean>(false);
  const setOpened = ctxState[1];

  useEffect(() => {
    getOpenAiApiKey().catch(() => {
      setOpened(true);
    });
  }, []);

  return (
    <apiKeyDialogCtx.Provider value={ctxState}>
      {children}

      <ApiKeyDialog />
    </apiKeyDialogCtx.Provider>
  );
}

function ApiKeyDialog() {
  const [opened, setOpened] = useApiKeyDialog();

  useEffect(() => {
    if (opened) {
      focusCurrentTab().catch(console.error);
    }
  }, [opened]);

  return (
    <Dialog open={opened} onOpenChange={setOpened}>
      {/* <DialogTrigger asChild>{children}</DialogTrigger> */}

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              defaultValue="Pedro Duarte"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input
              id="username"
              defaultValue="@peduarte"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function focusCurrentTab() {
  const current = await chrome.tabs.getCurrent();
  if (!current?.id) return;

  await chrome.tabs.update(current.id, { active: true });
}
