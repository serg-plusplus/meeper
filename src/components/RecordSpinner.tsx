import classNames from "clsx";
import { CSSProperties } from "react";

export default function RecordSpinner({
  className,
  style = {},
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={classNames("rw_spinner__container opacity-75", className)}
      style={style}
    >
      <div className="rw_spinner rw_spinner__1" />
      <div className="rw_spinner rw_spinner__2" />
      <div className="rw_spinner rw_spinner__3" />
      <div className="rw_spinner rw_spinner__4" />
      <div className="rw_spinner rw_spinner__5" />
    </div>
  );
}
