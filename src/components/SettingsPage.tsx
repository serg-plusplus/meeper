import classNames from "clsx";

export default function SettingsPage() {
  return (
    <div className={classNames("min-h-screen flex flex-col items-center")}>
      <h1 className="my-8 text-xl font-semibold text-muted-foreground text-center">
        Settings page
      </h1>
    </div>
  );
}
