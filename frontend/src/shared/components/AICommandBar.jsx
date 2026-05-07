import { useState } from "react";

import api from "../services/api";

import {
  useAIOperator
} from "../context/AIOperatorContext";

import {
  extractDOM
} from "../utils/extractDOM";


export default function AICommandBar() {

  const [command, setCommand] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [logs, setLogs] =
    useState([]);

  const [actionHistory, setActionHistory] =
    useState([]);

  const {
    aiMode
  } = useAIOperator();


  // =========================
  // LOGS
  // =========================

  const addLog = (msg) => {

    setLogs(prev => [

      ...prev.slice(-6),

      msg
    ]);
  };


  // =========================
  // HANDLE COMMAND
  // =========================

  const handleCommand = async () => {

    if (!command.trim()) return;

    try {

      setLoading(true);

      setActionHistory([]);

      addLog(
        `Goal: ${command}`
      );

      let completed = false;

      let steps = 0;

      const maxSteps = 10;

      // =========================
      // AUTONOMOUS LOOP
      // =========================

      while (
        !completed &&
        steps < maxSteps
      ) {

        steps++;

        addLog(
          `Step ${steps}`
        );

        // =========================
        // EXTRACT DOM
        // =========================

        const dom = extractDOM();

        console.log(
          "CURRENT DOM:",
          dom
        );

        // =========================
        // ASK AI
        // =========================

        const response = await api.post(
          "/ai/operator",
          {
            command,
            dom,
            history: actionHistory
          }
        );

        const action =
          response.data;

        console.log(
          "AI ACTION:",
          action
        );

        // =========================
        // LOOP DETECTION
        // =========================

        const recentActions =
          actionHistory.slice(-3);

        const repeated =
          recentActions.length >= 3 &&
          recentActions.every(a =>

            JSON.stringify(a) ===
            JSON.stringify(action)
          );

        if (repeated) {

          addLog(
            "Loop detected"
          );

          break;
        }

        // =========================
        // STORE HISTORY
        // =========================

        setActionHistory(prev => [

          ...prev,

          action
        ]);

        addLog(
          `Action: ${action.action}`
        );

        // =========================
        // DONE
        // =========================

        if (
          action.action === "done"
        ) {

          addLog(
            "Goal completed"
          );

          completed = true;

          break;
        }

        // =========================
        // CLICK ACTION
        // =========================

        if (
          action.action === "click"
        ) {

          const clickable = [

            ...document.querySelectorAll(
              `
              button,
              a,
              [role="button"],
              [onclick]
              `
            )

          ].filter(el =>

            !el.closest(
              "[data-ai-ignore='true']"
            )
          );

          const target =
            clickable.find(el => {

              const combined = `

                ${el.innerText}

                ${el.getAttribute("aria-label")}

                ${el.getAttribute("title")}

                ${el.href}

                ${el.className}

              `.toLowerCase();

              return combined.includes(
                action.target
                  ?.toLowerCase()
              );
            });

          if (target) {

            addLog(
              `Clicking ${action.target}`
            );

            console.log(
              "CLICKING:",
              target
            );

            target.click();

          } else {

            addLog(
              "Target not found"
            );

            break;
          }
        }

        // =========================
        // TYPE ACTION
        // =========================

        if (
          action.action === "type"
        ) {

          const inputs = [

            ...document.querySelectorAll(
              "input"
            )

          ].filter(input =>

            !input.closest(
              "[data-ai-ignore='true']"
            )
          );

          const target =
            inputs.find(input =>

              `
              ${input.placeholder}
              ${input.name}
              ${input.id}
              `
                .toLowerCase()
                .includes(
                  action.target
                    ?.toLowerCase()
                )
            );

          if (target) {

            target.focus();

            target.value =
              action.text;

            target.dispatchEvent(
              new Event(
                "input",
                { bubbles: true }
              )
            );

            addLog(
              `Typing ${action.text}`
            );

          } else {

            addLog(
              "Input not found"
            );

            break;
          }
        }

        // =========================
        // NAVIGATE
        // =========================

        if (
          action.action === "navigate"
        ) {

          addLog(
            `Navigating to ${action.url}`
          );

          window.history.pushState(
            {},
            "",
            action.url
          );

          window.dispatchEvent(
            new PopStateEvent(
              "popstate"
            )
          );
        }

        // =========================
        // WAIT FOR UI UPDATE
        // =========================

        await new Promise(resolve =>

          setTimeout(
            resolve,
            1500
          )
        );
      }

      // =========================
      // MAX STEP LIMIT
      // =========================

      if (steps >= maxSteps) {

        addLog(
          "Max step limit reached"
        );
      }

    } catch (err) {

      console.error(err);

      addLog(
        "Execution failed"
      );

    } finally {

      setLoading(false);
    }
  };


  // =========================
  // AI OFF
  // =========================

  if (!aiMode) return null;


  return (

    <div

      data-ai-ignore="true"

      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-2xl px-4"
    >

      <div className="bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden">

        {/* ========================= */}
        {/* LOGS */}
        {/* ========================= */}

        {logs.length > 0 && (

          <div className="border-b border-gray-100 px-4 py-2 bg-gray-50 text-xs text-gray-600 space-y-1 max-h-40 overflow-y-auto">

            {logs.map((log, i) => (

              <div key={i}>

                • {log}

              </div>
            ))}

          </div>
        )}


        {/* ========================= */}
        {/* INPUT AREA */}
        {/* ========================= */}

        <div className="p-3 flex items-center gap-3">

          <input

            type="text"

            value={command}

            onChange={(e) =>
              setCommand(e.target.value)
            }

            onKeyDown={(e) => {

              if (e.key === "Enter") {

                handleCommand();
              }
            }}

            placeholder="Ask AI to operate the app..."

            className="flex-1 outline-none px-4 py-3 rounded-xl bg-gray-100 text-sm"
          />

          <button

            onClick={handleCommand}

            disabled={loading}

            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-3 rounded-xl text-sm font-medium transition-all"
          >

            {
              loading
                ? "Running..."
                : "Run"
            }

          </button>

        </div>

      </div>

    </div>
  );
}