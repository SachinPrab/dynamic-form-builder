// pages/Form.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { shouldShowQuestion } from "../utils/conditionalLogic"; // Ensure this path is correct

export default function Form() {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false); 
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  // Fetch form
  useEffect(() => {
    const userId = JSON.parse(sessionStorage.getItem("currentUser"))?._id;
    if (!userId) {
      console.error("No user logged in");
      return;
    }

    setLoading(true);
    fetch(`${API_URL}/api/form/${formId}`, {
      headers: { "x-user-id": userId.toString() },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setForm(data.form);
        setLoading(false); 
        
        // Initialize answers with empty strings for all questions
        const initAnswers = {};
        data.form.questions.forEach((q) => (initAnswers[q.questionKey] = ""));
        setAnswers(initAnswers);
      })
      .catch((err) => {
        console.error("Failed to load form:", err);
        setLoading(false);
      });
  }, [formId]);

  const handleChange = (key, value) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    try {
      const userId = JSON.parse(sessionStorage.getItem("currentUser"))?._id;
      
      // 1. Determine which questions are currently visible
      const visibleQuestionKeys = form.questions
        .filter((q) => shouldShowQuestion(q.rules, answers))
        .map((q) => q.questionKey);

      // 2. Filter the answers object to include ONLY visible questions with non-empty values
      const answersToSubmit = {};
      Object.entries(answers).forEach(([key, value]) => {
        // ONLY include the answer if the question is visible AND the value is not an empty string
        if (visibleQuestionKeys.includes(key) && value !== "") {
          answersToSubmit[key] = value;
        }
      });

      // Safety check
      if (Object.keys(answersToSubmit).length === 0) {
        throw new Error("Please complete the visible required fields.");
      }

      // 3. Send the filtered answers payload to the backend
      const response = await fetch(
        `${API_URL}/api/form/${formId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId.toString(),
          },
          body: JSON.stringify({ answers: answersToSubmit }),
        }
      );

      if (!response.ok) {
        // Attempt to read the error message from the backend response body
        const errorData = await response.json();
        throw new Error(errorData.error || "Submit failed");
      }

      alert("Form submitted successfully!");
      console.log("Final Answers Submitted:", answersToSubmit);
    } catch (err) {
      alert("Submit failed: " + err.message);
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading)
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Loading form...
      </div>
    );
  if (!form) return <div>Error loading form</div>; 

  // ---- Apply conditional logic ----
  const visibleQuestions = form.questions
    .map((q) => ({
      ...q, 
      visible: shouldShowQuestion(q.rules, answers),
    }))
    .filter((q) => q.visible);

  const isComplete = visibleQuestions.every(
    (q) => answers[q.questionKey] !== undefined && answers[q.questionKey] !== ""
  );

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
            <h1>{form.tableId} Form</h1>     
      <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                
        {visibleQuestions.map((q) => (
          <div
            key={q.questionKey}
            style={{ display: "flex", flexDirection: "column" }}
          >
                        
            <label style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                            {q.label}
              {q.required && <span style={{ color: "red" }}>*</span>}            
            </label>
                        
            {q.type === "textarea" ? (
              <textarea
                style={{
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
                required={q.required}
                value={answers[q.questionKey] || ""}
                onChange={(e) => handleChange(q.questionKey, e.target.value)}
                rows={4}
              />
            ) : q.type === "singleSelect" ? (
              // Select input uses q.options (the new schema field)
              <select
                value={answers[q.questionKey] || ""}
                onChange={(e) => handleChange(q.questionKey, e.target.value)}
                style={{
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              >
                                <option value="">Select an option</option>     
                         
                {q.options?.map((opt) => (
                  <option key={opt} value={opt}>
                                        {opt}                 
                  </option>
                ))}
                             
              </select>
            ) : (
              <input
                type={q.type || "text"}
                style={{
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
                required={q.required}
                value={answers[q.questionKey] || ""}
                onChange={(e) => handleChange(q.questionKey, e.target.value)}
              />
            )}
                    
          </div>
        ))}
                
        {visibleQuestions.length === 0 && (
          <p style={{ textAlign: "center", color: "#666" }}>
                        Answer previous questions to unlock this form          
          </p>
        )}
                
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isComplete || submitLoading}
          style={{
            padding: "1rem",
            background: isComplete ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
            cursor: isComplete ? "pointer" : "not-allowed",
          }}
        >
                   
          {submitLoading
            ? "Submitting..."
            : isComplete
            ? "Submit Form"
            : `${
                form.questions.length - visibleQuestions.length
              } questions hidden, ${visibleQuestions.length} to complete`}
                 
        </button>
             
      </form>
           
      <div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
                Progress: {visibleQuestions.length}/{form.questions.length}
        visible questions      
      </div>
         
    </div>
  );
}