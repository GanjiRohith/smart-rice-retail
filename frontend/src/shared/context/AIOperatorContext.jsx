import {
  createContext,
  useContext,
  useState
} from "react";

const AIOperatorContext =
  createContext();

export const AIOperatorProvider = ({
  children
}) => {

  const [aiMode, setAiMode] =
    useState(false);

  return (

    <AIOperatorContext.Provider
      value={{
        aiMode,
        setAiMode
      }}
    >

      {children}

    </AIOperatorContext.Provider>
  );
};

export const useAIOperator = () => {

  return useContext(
    AIOperatorContext
  );
};