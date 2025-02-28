import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Tabs, Tab, ProgressBar } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faCheck,
  faCode,
  faEye,
  faEdit,
  faSave,
  faSun,
  faMoon,
} from "@fortawesome/free-solid-svg-icons";

const ProcessSteps = ({ currentStep, theme }) => {
  const steps = ["Analysis", "Code Generation", "Validation"];
  return (
    <div className="mb-4">
      <h5 className={`mb-3 ${theme === "dark" ? "text-light" : "text-muted"}`}>
        Processing Steps
      </h5>
      <div className="d-flex justify-content-between">
        {steps.map((step, index) => (
          <div key={step} className="text-center">
            <div
              className={`circle-step ${
                index <= currentStep ? "active-step" : ""
              } ${theme === "dark" ? "dark-step" : ""}`}
            >
              {index < currentStep ? (
                <FontAwesomeIcon icon={faCheck} />
              ) : (
                index + 1
              )}
            </div>
            <div
              className={`step-label ${theme === "dark" ? "text-light" : ""}`}
            >
              {step}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState({});
  const [editableOutput, setEditableOutput] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [activeTab, setActiveTab] = useState("html");
  const [viewMode, setViewMode] = useState("code"); // 'code' or 'preview'
  const [editMode, setEditMode] = useState(false);
  const [theme, setTheme] = useState("light"); // 'light' or 'dark'

  // Initialize editable output when output changes
  useEffect(() => {
    setEditableOutput({ ...output });
    setEditMode(false);
  }, [output]);

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setLoading(true);
    setCurrentStep(0);
    try {
      const response = await fetch(
        "http://localhost:5001/api/process-request",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requirement: input }),
        }
      );

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();
      setOutput(data);
      setCurrentStep(3);
      toast.success("Code generated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to generate code");
      setCurrentStep(-1);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.info(`${label} copied to clipboard!`);
  };

  const toggleViewMode = () => {
    if (editMode) {
      const confirmSwitch = window.confirm(
        "You have unsaved changes. Switch anyway?"
      );
      if (!confirmSwitch) return;
    }
    setViewMode(viewMode === "code" ? "preview" : "code");
  };

  const toggleEditMode = () => {
    if (editMode) {
      // Apply changes
      setOutput({ ...editableOutput });
      toast.success("Changes saved successfully!");
    }
    setEditMode(!editMode);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleCodeChange = (value) => {
    const updatedOutput = { ...editableOutput };
    updatedOutput[activeTab] = value;
    setEditableOutput(updatedOutput);
  };

  // Combine HTML, CSS, and JS for preview
  const getPreviewContent = () => {
    if (!output.html && !output.css && !output.js) {
      return `<div class="text-center p-5 ${
        theme === "dark" ? "text-light bg-dark" : ""
      }">Generate code first to see preview</div>`;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            ${output.css || ""}
            ${
              theme === "dark"
                ? "body { background-color: #343a40; color: #f8f9fa; }"
                : ""
            }
          </style>
        </head>
        <body>
          ${output.html || ""}
          <script>${output.js || ""}</script>
        </body>
      </html>
    `;
  };

  const bgClass = theme === "dark" ? "bg-dark text-light" : "bg-light";
  const borderClass = theme === "dark" ? "border-secondary" : "border-end";

  return (
    <div
      className={`container-fluid vh-100 ${
        theme === "dark" ? "bg-dark text-light" : ""
      }`}
    >
      <ToastContainer position="top-right" autoClose={3000} theme={theme} />
      <div className="row h-100">
        {/* Header with theme toggle */}
        <div
          className="col-12 py-2 px-3 d-flex justify-content-between align-items-center border-bottom"
          style={{
            height: "50px",
            backgroundColor: theme === "dark" ? "#212529" : "#f8f9fa",
          }}
        >
          <h4 className="m-0">
            <FontAwesomeIcon icon={faCode} className="me-2" />
            Code Generator
          </h4>
          <button
            onClick={toggleTheme}
            className={`btn btn-sm ${
              theme === "dark" ? "btn-outline-light" : "btn-outline-dark"
            }`}
          >
            <FontAwesomeIcon
              icon={theme === "dark" ? faSun : faMoon}
              className="me-2"
            />
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        {/* Main Content */}
        <div className="col-12" style={{ height: "calc(100% - 50px)" }}>
          <div className="row h-100">
            {/* Input Section */}
            <div className={`col-12 col-lg-3 p-3 ${bgClass} ${borderClass}`}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className={`form-control mb-3 ${
                  theme === "dark" ? "bg-secondary text-light" : ""
                }`}
                rows="6"
                placeholder="Describe your landing page or form..."
                disabled={loading}
              />

              <ProcessSteps currentStep={currentStep} theme={theme} />

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn btn-primary w-100 py-2 mb-3"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Generating...
                  </>
                ) : (
                  "Generate Code"
                )}
              </button>

              <button
                onClick={toggleViewMode}
                className={`btn ${
                  theme === "dark"
                    ? "btn-outline-light"
                    : "btn-outline-secondary"
                } w-100 py-2`}
                disabled={!output.html && !output.css && !output.js}
              >
                <FontAwesomeIcon
                  icon={viewMode === "code" ? faEye : faCode}
                  className="me-2"
                />
                {viewMode === "code"
                  ? "Switch to Preview"
                  : "Switch to Code Editor"}
              </button>
            </div>

            {/* Code/Preview Section */}
            <div className="col-12 col-lg-6 p-3">
              {viewMode === "code" ? (
                // Code Editor View
                <div className="h-100 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Tabs
                      activeKey={activeTab}
                      onSelect={(k) => setActiveTab(k)}
                      className={`mb-0 flex-grow-1 ${
                        theme === "dark" ? "dark-tabs" : ""
                      }`}
                    >
                      <Tab eventKey="html" title="HTML" />
                      <Tab eventKey="css" title="CSS" />
                      <Tab eventKey="js" title="JavaScript" />
                    </Tabs>
                    <div>
                      <button
                        onClick={toggleEditMode}
                        className={`btn btn-sm ${
                          editMode ? "btn-success" : "btn-outline-primary"
                        } me-2`}
                        disabled={!output.html && !output.css && !output.js}
                      >
                        <FontAwesomeIcon
                          icon={editMode ? faSave : faEdit}
                          className="me-2"
                        />
                        {editMode ? "Save Changes" : "Edit Code"}
                      </button>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            editMode
                              ? editableOutput[activeTab]
                              : output[activeTab],
                            activeTab.toUpperCase()
                          )
                        }
                        className={`btn btn-sm ${
                          theme === "dark"
                            ? "btn-outline-light"
                            : "btn-outline-secondary"
                        }`}
                        disabled={!output[activeTab]}
                      >
                        <FontAwesomeIcon icon={faCopy} className="me-2" />
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex-grow-1">
                    <Editor
                      height="70vh"
                      language={activeTab}
                      value={
                        editMode
                          ? editableOutput[activeTab]
                          : output[activeTab] ||
                            `// ${activeTab.toUpperCase()} code will appear here...`
                      }
                      onChange={handleCodeChange}
                      options={{
                        readOnly: !editMode,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        theme: theme === "dark" ? "vs-dark" : "vs",
                      }}
                    />
                  </div>
                </div>
              ) : (
                // Preview Mode
                <div className="h-100 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="m-0">Live Preview</h5>
                    <button
                      onClick={toggleViewMode}
                      className={`btn btn-sm ${
                        theme === "dark"
                          ? "btn-outline-light"
                          : "btn-outline-primary"
                      }`}
                    >
                      <FontAwesomeIcon icon={faCode} className="me-2" />
                      Edit Code
                    </button>
                  </div>
                  <div
                    className={`flex-grow-1 border rounded p-0 overflow-hidden ${
                      theme === "dark" ? "border-secondary" : ""
                    }`}
                  >
                    <iframe
                      srcDoc={getPreviewContent()}
                      title="Preview"
                      className="w-100 h-100 border-0"
                      sandbox="allow-scripts"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Analysis & Validation */}
            <div
              className={`col-12 col-lg-3 p-3 ${bgClass} border-start ${
                theme === "dark" ? "border-secondary" : ""
              }`}
            >
              <div className="mb-4">
                <h5 className="mb-3">Analysis</h5>
                <div
                  className={`analysis-box p-3 rounded shadow-sm ${
                    theme === "dark" ? "bg-secondary" : "bg-white"
                  }`}
                >
                  {output.analysis || "Analysis will appear here..."}
                </div>
              </div>

              <div>
                <h5 className="mb-3">Validation</h5>
                <div
                  className={`validation-box p-3 rounded shadow-sm ${
                    theme === "dark" ? "bg-secondary" : "bg-white"
                  }`}
                >
                  {output.validation ||
                    "Validation results will appear here..."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
