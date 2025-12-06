// controllers/webhookController.js

import Submission from "../models/submissionModel.js"; // To interact with the DB submissions
import Form from "../models/Form.js"; // To look up form details (base/table) if needed, though often not required for update/delete

/**
 * Handle incoming Airtable webhook events (updates and deletions).
 */
export const handleAirtableWebhook = async (req, res) => {
    // 1. Initial Webhook Verification (Airtable sends an empty POST body to verify)
    if (Object.keys(req.body).length === 0) {
        // This is the verification request from Airtable
        return res.status(200).send("Webhook verified successfully.");
    }
    
    // 2. Extract Event Details
    const { baseId, changedRecords } = req.body;
    
    // If no changes, return OK
    if (!changedRecords) {
        return res.status(200).json({ message: "No record changes detected." });
    }
    
    // 3. Process Updates
    const updatedRecords = changedRecords.recordsUpdated || {};
    const updatedIds = Object.keys(updatedRecords);
    
    if (updatedIds.length > 0) {
        console.log(`Processing ${updatedIds.length} updated records for base ${baseId}`);
        for (const recordId of updatedIds) {
            const changes = updatedRecords[recordId].current;
            
            // Assuming Airtable changes might only include the 'answers' (fields) if the form was resubmitted/edited.
            // In a real-world scenario, you might fetch the full record from Airtable 
            // to ensure you have all fields, but for this exercise, we update the answers.
            
            const airtableFields = changes.fieldSet; // The structure usually contains the fields that changed
            
            // To properly update, we need the Form ID associated with this base/table.
            // Since Submission model uses 'submissionId' to store the Airtable record ID, 
            // we use that to find the local DB record.
            
            try {
                // Find the submission using the Airtable Record ID (stored as submissionId in our model)
                const dbSubmission = await Submission.findOne({ 
                    submissionId: recordId
                });

                if (dbSubmission) {
                    // NOTE: This assumes 'airtableFields' directly maps back to your 'answers' structure. 
                    // In a production app, you'd need a more robust field mapping here.
                    dbSubmission.answers = { ...dbSubmission.answers, ...airtableFields };
                    dbSubmission.status = "Updated"; // Mark status change
                    await dbSubmission.save();
                    console.log(`Updated submission ${recordId} in DB.`);
                } else {
                    console.warn(`Submission with Airtable ID ${recordId} not found locally.`);
                }
            } catch (error) {
                console.error(`Error processing update for ${recordId}:`, error);
            }
        }
    }

    // 4. Process Deletions
    const deletedRecordIds = changedRecords.recordsDeleted || [];

    if (deletedRecordIds.length > 0) {
        console.log(`Processing ${deletedRecordIds.length} deleted records for base ${baseId}`);
        
        try {
            // Find and update submissions: set a flag instead of deleting
            const result = await Submission.updateMany(
                { submissionId: { $in: deletedRecordIds } }, // Match all deleted Airtable IDs
                { 
                    $set: { 
                        deletedInAirtable: true,
                        status: "Deleted" 
                    } 
                }
            );
            console.log(`Flagged ${result.nModified} submissions as deletedInAirtable.`);
            
        } catch (error) {
            console.error("Error processing deletions:", error);
        }
    }
    
    res.status(200).json({ success: true });
};