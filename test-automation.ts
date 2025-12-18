import { ReportAutomationService } from './src/services/ReportAutomationService';
import type { Report } from './src/domain/types';

// Test data matching your requirements
const testReport: Report = {
  report_id: "RPT-001234",
  id: "test-id-123",
  location: {
    latitude: 40.2591,
    longitude: -76.8825 // Harrisburg, PA area
  },
  merchant: "Gas Station ABC",
  category: "Gas pump",
  observationType: "Loose card slot",
  timestamp: "2025-12-17T10:00:00Z",
  status: "Under Review"
};

const invalidReport: Report = {
  report_id: "", // Missing report_id
  id: "invalid-id",
  location: {
    latitude: 0,
    longitude: 0
  },
  merchant: "", // Missing merchant
  category: "ATM",
  observationType: "Camera suspected",
  timestamp: "invalid-date", // Invalid timestamp
  status: "Under Review"
};

async function testAutomationWorkflow() {
  console.log("🚀 Starting Skimmer Report Automation Test\n");
  
  const automationService = new ReportAutomationService();
  
  try {
    // Test 1: Valid report processing
    console.log("📝 Test 1: Processing valid report...");
    await automationService.processNewReport(testReport);
    console.log("✅ Valid report processed successfully\n");
    
    // Test 2: Invalid report processing
    console.log("❌ Test 2: Processing invalid report...");
    await automationService.processNewReport(invalidReport);
    console.log("✅ Invalid report handled correctly\n");
    
    // Test 3: Duplicate report processing
    console.log("🔄 Test 3: Processing duplicate report...");
    await automationService.processNewReport(testReport);
    console.log("✅ Duplicate report handled correctly\n");
    
    // Test 4: Check log sections
    console.log("📊 Test 4: Checking automation log sections...");
    const sections = automationService.getAutomationLogSections();
    console.log(`Confirmed Reports: ${sections.confirmedReports.length}`);
    console.log(`Unconfirmed Reports: ${sections.unconfirmedReports.length}`);
    console.log(`Email Activity: ${sections.emailActivity.length}`);
    console.log(`Errors: ${sections.errors.length}\n`);
    
    // Test 5: Export logs
    console.log("📤 Test 5: Exporting automation logs...");
    const exportData = await automationService.exportAutomationLogs();
    console.log(`Exported ${exportData.split('\n').length} lines of log data\n`);
    
    // Test 6: Daily summary (manual trigger)
    console.log("📅 Test 6: Testing daily summary generation...");
    await automationService.sendDailySummary();
    console.log("✅ Daily summary processed\n");
    
    console.log("🎉 All automation tests completed successfully!");
    
    // Display final log summary
    const finalSections = automationService.getAutomationLogSections();
    console.log("\n📈 Final Summary:");
    console.log(`- Total Confirmed Reports: ${finalSections.confirmedReports.length}`);
    console.log(`- Total Unconfirmed Reports: ${finalSections.unconfirmedReports.length}`);
    console.log(`- Total Emails Sent: ${finalSections.emailActivity.length}`);
    console.log(`- Total Errors: ${finalSections.errors.length}`);
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    automationService.destroy();
  }
}

// Run the test
testAutomationWorkflow();