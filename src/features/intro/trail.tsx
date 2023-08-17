import { a, useTrail } from "@react-spring/web";
import {
  type PropsWithChildren,
  type HtmlHTMLAttributes,
  Children,
} from "react";

export function Trail({
  open,
  children,
  ...restProps
}: PropsWithChildren<{ open: boolean } & HtmlHTMLAttributes<HTMLDivElement>>) {
  const items = Children.toArray(children);
  const trail = useTrail(items.length, {
    config: { mass: 5, tension: 2000, friction: 200 },
    opacity: open ? 1 : 0,
    x: open ? 0 : 20,
    height: open ? 130 : 0,
    from: { opacity: 0, x: 20, height: 0 },
  });
  return (
    <div {...restProps}>
      {trail.map(({ height, ...style }, index) => (
        <a.div key={index} className="" style={style}>
          <a.div style={{ height }}>{items[index]}</a.div>
        </a.div>
      ))}
    </div>
  );
}
