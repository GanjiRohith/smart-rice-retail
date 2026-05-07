import {
  useAIOperator
} from "../context/AIOperatorContext";

export default function AIToggle() {

  const {
    aiMode,
    setAiMode
  } = useAIOperator();

  return (

    <button

      onClick={() =>
        setAiMode(!aiMode)
      }

      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        aiMode
          ? "bg-green-600 text-white"
          : "bg-gray-200 text-gray-700"
      }`}
    >

      {
        aiMode
          ? "AI ON"
          : "AI OFF"
      }

    </button>
  );
}