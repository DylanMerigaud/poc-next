import { AnimatePresence, motion } from "framer-motion";
import { Trail } from "./trail";

export function Intro({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute inset-0 z-10 h-screen w-screen bg-base-100"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
        >
          <Trail
            open={true}
            className="overflow-hidden text-9xl font-extrabold leading-[0.9] tracking-tighter will-change-[transform,opacity]"
          >
            <span>STYLECROP</span>
            <span>MAKES</span>
            <span>YOU</span>
            <span>UNIQUE</span>
          </Trail>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
