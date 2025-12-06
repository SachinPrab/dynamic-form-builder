// pages/BaseSelector.jsx
import { useEffect, useState } from "react";

export default function BaseSelector() {
  const [bases, setBases] = useState([]);
  const [tables, setTables] = useState([]);
  const [fields, setFields] = useState([]);

  const [selectedBase, setSelectedBase] = useState("");
  const [selectedTable, setSelectedTable] = useState(null); // 🎯 CHANGE 1: Store table object (null initially)
  const [selectedFields, setSelectedFields] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const user = JSON.parse(sessionStorage.getItem("currentUser"));

  if (!user || !user._id) {
    setError("Not logged in!");
    // Early exit if not logged in to avoid running hooks
    return (
        <div style={{ color: "red", padding: "20px" }}>
            Not logged in! Please log in to continue.
        </div>
    );
  }
  // Fetch bases on mount
  useEffect(() => {
    fetchBases();
  }, []);

  // Fetch tables when base is selected
  useEffect(() => {
    if (selectedBase) {
      fetchTables(selectedBase);
      setSelectedTable(null); // Reset table selection
      setFields([]); // Reset fields
      setSelectedFields([]);
    }
  }, [selectedBase]);

  // Fetch fields when table is selected
  useEffect(() => {
    if (selectedTable && selectedBase) {
      fetchFields(selectedBase, selectedTable.id); // Use selectedTable.id
      setSelectedFields([]); // Reset field selection
    }
  }, [selectedTable, selectedBase]);

  const fetchBases = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:4000/api/bases", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user._id,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Error from /api/bases:", res.status, text);
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();
      setBases(data.bases || []);
    } catch (err) {
      setError("Error fetching bases: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async (baseId) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:4000/api/bases/${baseId}/tables`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user._id,
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Error from /api/tables:", res.status, text);
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();
      setTables(data.tables || []);
    } catch (err) {
      setError("Error fetching tables: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFields = async (baseId, tableId) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:4000/api/bases/${baseId}/tables/${tableId}/fields`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user._id,
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Error from /api/fields:", res.status, text);
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();
      // 🎯 REMOVED: Filter out "Attachment Summary" and any other read-only field types
      const filteredFields = data.fields.filter(f => f.name !== "Attachment Summary");
      setFields(filteredFields || []);
    } catch (err) {
      setError("Error fetching fields: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFieldSelection = (fieldId) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

const handleSubmit = async () => {
  if (!selectedBase || !selectedTable || selectedFields.length === 0) { // Check for selectedTable (object)
    setError("Please select a base, table, and at least one field.");
    return;
  }

  const selectedFieldObj = fields.filter((f) =>
    selectedFields.includes(f.id)
  );

  try {
    const res = await fetch("http://localhost:4000/api/form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user._id,
      },
      body: JSON.stringify({
        baseId: selectedBase,
        tableId: selectedTable.id, // 🎯 CHANGE 3: Use ID from the object
        tableName: selectedTable.name, // 🎯 CHANGE 4: Include the table Name
        fields: selectedFieldObj,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // redirect to form page
    window.location.href = `/form/${data.formId}`;
  } catch (err) {
    setError("Error creating form: " + err.message);
  }
};


  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Form Builder</h1>

      {error && (
        <div style={{ color: "red", marginBottom: "15px" }}>{error}</div>
      )}

      {/* Base Selector */}
      <div style={{ marginBottom: "20px" }}>
        <label>
          <strong>Step 1: Select Base</strong>
        </label>
        <select
          value={selectedBase}
          onChange={(e) => setSelectedBase(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            marginTop: "8px",
            fontSize: "14px",
          }}
        >
          <option value="">-- Choose a Base --</option>
          {bases.map((base) => (
            <option key={base.id} value={base.id}>
              {base.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table Selector */}
      {selectedBase && (
        <div style={{ marginBottom: "20px" }}>
          <label>
            <strong>Step 2: Select Table</strong>
          </label>
          <select
            value={selectedTable ? selectedTable.id : ""} // 🎯 CHANGE 2: Use ID for select value
            onChange={(e) => {
              const tableId = e.target.value;
              // Find the table object from the fetched tables array
              const table = tables.find(t => t.id === tableId);
              setSelectedTable(table); // Set the full table object
            }}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "8px",
              fontSize: "14px",
            }}
          >
            <option value="">-- Choose a Table --</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Field Selector */}
      {selectedTable && fields.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <label>
            <strong>Step 3: Select Fields to Display in Form</strong>
          </label>
          <div
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              marginTop: "8px",
              borderRadius: "4px",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {fields.map((field) => (
              <div
                key={field.id}
                style={{
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <input
                  type="checkbox"
                  id={field.id}
                  checked={selectedFields.includes(field.id)}
                  onChange={() => toggleFieldSelection(field.id)}
                  style={{ marginRight: "10px", cursor: "pointer" }}
                />
                <label htmlFor={field.id} style={{ cursor: "pointer" }}>
                  {field.name} <small>({field.type})</small>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      {selectedTable && (
        <button
          onClick={handleSubmit}
          disabled={selectedFields.length === 0} // Disable if no fields are selected
          style={{
            padding: "10px 20px",
            backgroundColor: selectedFields.length > 0 ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: selectedFields.length > 0 ? "pointer" : "not-allowed",
            fontSize: "14px",
          }}
        >
          Create Form
        </button>
      )}

      {loading && <p>Loading...</p>}
    </div>
  );
}