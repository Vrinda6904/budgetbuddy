import { motion } from "framer-motion";
import { Sparkles} from "lucide-react";

const AnimatedBadge = ({ title, username, color }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, type: "spring" }}
      className={`flex items-center gap-2 p-3 rounded-lg shadow-lg text-white ${color}`}
    >
      <Sparkles className="w-5 h-5 animate-pulse" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs">{username || "N/A"}</p>
      </div>
    </motion.div>
  );
};

export default AnimatedBadge;
