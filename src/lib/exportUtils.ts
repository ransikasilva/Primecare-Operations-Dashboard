import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Map Data Export Functions
export const exportMapDataToExcel = (data: any) => {
  const workbook = XLSX.utils.book_new();
  
  // Hospital Networks Sheet
  if (data.hospital_networks) {
    const hospitalData = data.hospital_networks.map((network: any) => ({
      'Network Name': network.network_name,
      'Network ID': network.network_id || network.id,
      'Status': network.network_status || 'Active',
      'Admin Name': network.admin_name || 'Not specified',
      'Admin Email': network.admin_email || 'Not specified',
      'Location': network.hospitals?.[0] ? `${network.hospitals[0].city}, ${network.hospitals[0].province}` : 'Not specified',
      'Latitude': network.hospitals?.[0]?.coordinates_lat || 'Not available',
      'Longitude': network.hospitals?.[0]?.coordinates_lng || 'Not available',
      'Created At': network.network_created_at ? new Date(network.network_created_at).toLocaleDateString() : 'Not specified'
    }));
    const hospitalSheet = XLSX.utils.json_to_sheet(hospitalData);
    XLSX.utils.book_append_sheet(workbook, hospitalSheet, 'Hospital Networks');
  }
  
  // Collection Centers Sheet
  if (data.collection_centers) {
    const centerData = data.collection_centers.map((center: any) => ({
      'Center Name': center.center_name,
      'Center ID': center.id,
      'Contact Person': center.contact_person || 'Not specified',
      'Phone': center.contact_phone || 'Not specified',
      'Email': center.contact_email || 'Not specified',
      'Address': center.address || 'Not specified',
      'City': center.city || 'Not specified',
      'District': center.district || 'Not specified',
      'Latitude': center.coordinates_lat || 'Not available',
      'Longitude': center.coordinates_lng || 'Not available',
      'Status': center.status || 'Active'
    }));
    const centerSheet = XLSX.utils.json_to_sheet(centerData);
    XLSX.utils.book_append_sheet(workbook, centerSheet, 'Collection Centers');
  }
  
  // Riders Sheet
  if (data.riders) {
    const riderData = data.riders.map((rider: any) => ({
      'Rider ID': rider.id,
      'Full Name': rider.full_name || 'Not specified',
      'Phone': rider.mobile_number || 'Not specified',
      'Availability': rider.availability_status || 'Unknown',
      'Total Deliveries': rider.total_deliveries || 0,
      'Rating': rider.rating || 'Not rated',
      'Current Location Lat': rider.current_location_lat || 'Not available',
      'Current Location Lng': rider.current_location_lng || 'Not available',
      'Status': rider.status || 'Active'
    }));
    const riderSheet = XLSX.utils.json_to_sheet(riderData);
    XLSX.utils.book_append_sheet(workbook, riderSheet, 'Riders');
  }
  
  // Generate and download Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `system-map-data-${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};

export const exportMapDataToPDF = async (data: any) => {
  const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Title
  pdf.setFontSize(20);
  pdf.setTextColor(0, 0, 0);
  pdf.text('TransFleet System Map Data Export', 20, 25);
  
  // Date
  pdf.setFontSize(12);
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
  
  let yPosition = 50;
  
  // Hospital Networks Summary
  if (data.hospital_networks && data.hospital_networks.length > 0) {
    pdf.setFontSize(16);
    pdf.setTextColor(93, 173, 226);
    pdf.text('Hospital Networks Summary', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    const networkHeaders = ['Network Name', 'Status', 'Admin', 'Location'];
    const networkData = data.hospital_networks.slice(0, 10).map((network: any) => [
      network.network_name || 'Unknown',
      network.network_status || 'Active',
      network.admin_name || 'Not specified',
      network.hospitals?.[0] ? `${network.hospitals[0].city || ''}, ${network.hospitals[0].province || ''}` : 'Not specified'
    ]);
    
    // Simple table implementation
    const colWidth = (pageWidth - 40) / networkHeaders.length;
    networkHeaders.forEach((header, index) => {
      pdf.text(header, 20 + (index * colWidth), yPosition);
    });
    yPosition += 8;
    
    networkData.forEach((row: any[], rowIndex: number) => {
      row.forEach((cell: any, cellIndex: number) => {
        pdf.text(String(cell).substring(0, 25), 20 + (cellIndex * colWidth), yPosition);
      });
      yPosition += 6;
    });
    
    yPosition += 10;
  }
  
  // Collection Centers Summary
  if (data.collection_centers && data.collection_centers.length > 0) {
    if (yPosition > pageHeight - 50) {
      pdf.addPage();
      yPosition = 25;
    }
    
    pdf.setFontSize(16);
    pdf.setTextColor(93, 173, 226);
    pdf.text('Collection Centers Summary', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    const centerHeaders = ['Center Name', 'Contact Person', 'City', 'Status'];
    const centerData = data.collection_centers.slice(0, 10).map((center: any) => [
      center.center_name || 'Unknown',
      center.contact_person || 'Not specified',
      center.city || 'Not specified',
      center.status || 'Active'
    ]);
    
    const colWidth = (pageWidth - 40) / centerHeaders.length;
    centerHeaders.forEach((header, index) => {
      pdf.text(header, 20 + (index * colWidth), yPosition);
    });
    yPosition += 8;
    
    centerData.forEach((row: any[], rowIndex: number) => {
      row.forEach((cell: any, cellIndex: number) => {
        pdf.text(String(cell).substring(0, 25), 20 + (cellIndex * colWidth), yPosition);
      });
      yPosition += 6;
    });
  }
  
  // Statistics Summary
  if (yPosition > pageHeight - 80) {
    pdf.addPage();
    yPosition = 25;
  }
  
  yPosition += 20;
  pdf.setFontSize(16);
  pdf.setTextColor(93, 173, 226);
  pdf.text('System Statistics', 20, yPosition);
  yPosition += 15;
  
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  
  const stats = [
    `Total Hospital Networks: ${data.hospital_networks?.length || 0}`,
    `Total Collection Centers: ${data.collection_centers?.length || 0}`,
    `Total Riders: ${data.riders?.length || 0}`,
    `Active Riders: ${data.riders?.filter((r: any) => r.availability_status === 'available').length || 0}`
  ];
  
  stats.forEach(stat => {
    pdf.text(stat, 20, yPosition);
    yPosition += 10;
  });
  
  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Generated by TransFleet Operations Dashboard', 20, pageHeight - 15);
  
  pdf.save(`system-map-data-${new Date().toISOString().split('T')[0]}.pdf`);
};

// QR Tracking Report Export Functions
export const exportQRTrackingToExcel = (qrLogs: any[]) => {
  const workbook = XLSX.utils.book_new();
  
  const trackingData = qrLogs.map((log: any) => ({
    'QR Code': log.qr_code || log.id,
    'Order ID': log.order_id || 'Not specified',
    'Status': log.status || 'Unknown',
    'Collection Center': log.collection_center || 'Not specified',
    'Hospital': log.hospital || 'Not specified',
    'Rider': log.rider_name || log.rider || 'Not specified',
    'Pickup Time': log.pickup_time ? new Date(log.pickup_time).toLocaleString() : 'Not specified',
    'Delivery Time': log.delivery_time ? new Date(log.delivery_time).toLocaleString() : 'Pending',
    'Duration': log.duration || 'Calculating',
    'Location': log.location || 'Not specified',
    'Distance': log.distance || 'Not specified',
    'Created At': log.created_at ? new Date(log.created_at).toLocaleString() : 'Not specified'
  }));
  
  const sheet = XLSX.utils.json_to_sheet(trackingData);
  XLSX.utils.book_append_sheet(workbook, sheet, 'QR Tracking Report');
  
  // Generate and download Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `qr-tracking-report-${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};

export const exportQRTrackingToPDF = (qrLogs: any[]) => {
  const pdf = new jsPDF('l', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Title
  pdf.setFontSize(20);
  pdf.setTextColor(0, 0, 0);
  pdf.text('QR Code Tracking Report', 20, 25);
  
  // Date and summary
  pdf.setFontSize(12);
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
  pdf.text(`Total Records: ${qrLogs.length}`, 20, 45);
  
  let yPosition = 60;
  
  // Table headers
  const headers = ['QR Code', 'Status', 'Center', 'Hospital', 'Rider', 'Pickup Time'];
  const colWidth = (pageWidth - 40) / headers.length;
  
  pdf.setFontSize(10);
  pdf.setTextColor(93, 173, 226);
  headers.forEach((header, index) => {
    pdf.text(header, 20 + (index * colWidth), yPosition);
  });
  
  yPosition += 8;
  pdf.setTextColor(0, 0, 0);
  
  // Table data
  qrLogs.slice(0, 25).forEach((log, index) => {
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = 25;
      
      // Repeat headers on new page
      pdf.setTextColor(93, 173, 226);
      headers.forEach((header, index) => {
        pdf.text(header, 20 + (index * colWidth), yPosition);
      });
      yPosition += 8;
      pdf.setTextColor(0, 0, 0);
    }
    
    const row = [
      (log.qr_code || log.id || 'N/A').toString().substring(0, 15),
      (log.status || 'Unknown').toString().substring(0, 12),
      (log.collection_center || 'N/A').toString().substring(0, 15),
      (log.hospital || 'N/A').toString().substring(0, 15),
      (log.rider_name || log.rider || 'N/A').toString().substring(0, 12),
      log.pickup_time ? new Date(log.pickup_time).toLocaleDateString() : 'Pending'
    ];
    
    row.forEach((cell, cellIndex) => {
      pdf.text(cell, 20 + (cellIndex * colWidth), yPosition);
    });
    
    yPosition += 6;
  });
  
  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Generated by TransFleet Operations Dashboard', 20, pageHeight - 15);
  
  pdf.save(`qr-tracking-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

// Enhanced Analytics Export with specialized report types
export const exportAnalyticsData = async (data: any, format: 'excel' | 'pdf') => {
  if (format === 'excel') {
    const workbook = XLSX.utils.book_new();

    // Determine report type and create appropriate sheets
    const reportType = data.reportType || 'General Analytics Report';

    if (reportType === 'Executive Dashboard Report') {
      // Executive Summary Sheet
      const execSummary = [
        { 'Metric': 'Total Deliveries', 'Value': data.totalDeliveries, 'Status': 'Current Month' },
        { 'Metric': 'System SLA', 'Value': `${data.systemSLA}%`, 'Status': data.systemSLA >= 95 ? 'Excellent' : 'Good' },
        { 'Metric': 'Active Networks', 'Value': data.activeNetworks, 'Status': 'Operating' },
        { 'Metric': 'Monthly Growth', 'Value': `${data.executiveMetrics?.monthlyGrowth || 0}%`, 'Status': 'Trend' },
        { 'Metric': 'Revenue Impact', 'Value': data.executiveMetrics?.revenueImpact || 'N/A', 'Status': 'Monthly' },
        { 'Metric': 'Market Penetration', 'Value': data.executiveMetrics?.marketPenetration || 'N/A', 'Status': 'Coverage' }
      ];
      const execSheet = XLSX.utils.json_to_sheet(execSummary);
      XLSX.utils.book_append_sheet(workbook, execSheet, 'Executive Summary');

      // Business Insights Sheet
      if (data.businessInsights) {
        const insights = [
          { 'Area': 'Growth Trend', 'Assessment': data.businessInsights.growthTrend, 'Impact': 'High' },
          { 'Area': 'Performance Status', 'Assessment': data.businessInsights.performanceStatus, 'Impact': 'Critical' },
          { 'Area': 'Expansion Opportunity', 'Assessment': `${data.businessInsights.expansionOpportunity} networks`, 'Impact': 'Revenue' }
        ];
        const insightsSheet = XLSX.utils.json_to_sheet(insights);
        XLSX.utils.book_append_sheet(workbook, insightsSheet, 'Business Insights');
      }

    } else if (reportType === 'Operational Performance Report') {
      // Operational Metrics Sheet
      const opMetrics = [
        { 'Metric': 'Average Delivery Time', 'Value': `${data.operationalMetrics?.avgDeliveryTime || 0} min`, 'Target': '< 45 min' },
        { 'Metric': 'On-Time Delivery Rate', 'Value': `${data.operationalMetrics?.onTimeDeliveryRate || 0}%`, 'Target': '95%' },
        { 'Metric': 'Rider Utilization', 'Value': data.operationalMetrics?.riderUtilization || 'N/A', 'Target': '80%' },
        { 'Metric': 'Daily Throughput', 'Value': data.operationalMetrics?.dailyThroughput || 0, 'Target': 'Variable' },
        { 'Metric': 'Peak Hour Performance', 'Value': data.operationalMetrics?.peakHourPerformance || 'N/A', 'Target': '85%' }
      ];
      const opSheet = XLSX.utils.json_to_sheet(opMetrics);
      XLSX.utils.book_append_sheet(workbook, opSheet, 'Operational Metrics');

      // Performance Breakdown Sheet
      if (data.performanceBreakdown && data.performanceBreakdown.length > 0) {
        const perfSheet = XLSX.utils.json_to_sheet(data.performanceBreakdown);
        XLSX.utils.book_append_sheet(workbook, perfSheet, 'Network Performance');
      }

    } else if (reportType === 'Financial & Business Report') {
      // Financial Overview Sheet
      const finOverview = [
        { 'Metric': 'Total Monthly Revenue', 'Value': `Rs. ${(data.financialMetrics?.totalMonthlyRevenue || 0).toLocaleString()}` },
        { 'Metric': 'Subscription Revenue', 'Value': `Rs. ${(data.financialMetrics?.subscriptionRevenue || 0).toLocaleString()}` },
        { 'Metric': 'Active Subscriptions', 'Value': data.financialMetrics?.activeSubscriptions || 0 },
        { 'Metric': 'Total Subscriptions', 'Value': data.financialMetrics?.totalSubscriptions || 0 },
        { 'Metric': 'Average Revenue Per Network', 'Value': `Rs. ${Math.round(data.financialMetrics?.averageRevenuePerNetwork || 0).toLocaleString()}` },
        { 'Metric': 'Revenue Growth', 'Value': data.financialMetrics?.revenueGrowth || 'N/A' },
        { 'Metric': 'Operational Cost', 'Value': `Rs. ${(data.financialMetrics?.operationalCost || 0).toLocaleString()}` },
        { 'Metric': 'Net Margin', 'Value': `Rs. ${(data.financialMetrics?.netMargin || 0).toLocaleString()}` },
        { 'Metric': 'Profit Margin', 'Value': data.financialMetrics?.profitMargin || 'N/A' }
      ];
      const finSheet = XLSX.utils.json_to_sheet(finOverview);
      XLSX.utils.book_append_sheet(workbook, finSheet, 'Financial Overview');

      // Subscription Analysis Sheet
      if (data.subscriptionAnalysis) {
        const subAnalysis = [
          { 'Status': 'Active Subscriptions', 'Count': data.subscriptionAnalysis.activeCount, 'Impact': 'Revenue Generating' },
          { 'Status': 'Suspended Subscriptions', 'Count': data.subscriptionAnalysis.suspendedCount, 'Impact': 'Revenue at Risk' },
          { 'Status': 'Expired Subscriptions', 'Count': data.subscriptionAnalysis.expiredCount, 'Impact': 'Lost Revenue' },
          { 'Status': 'Total Networks', 'Count': data.subscriptionAnalysis.totalNetworks, 'Impact': 'Total Market' },
          { 'Status': 'Compliance Rate', 'Count': data.subscriptionAnalysis.complianceRate, 'Impact': 'Health Score' }
        ];
        const subSheet = XLSX.utils.json_to_sheet(subAnalysis);
        XLSX.utils.book_append_sheet(workbook, subSheet, 'Subscription Analysis');
      }

      // Network Subscriptions Detail Sheet
      if (data.networkSubscriptions && data.networkSubscriptions.length > 0) {
        const netSubSheet = XLSX.utils.json_to_sheet(data.networkSubscriptions);
        XLSX.utils.book_append_sheet(workbook, netSubSheet, 'Network Subscriptions');
      }

      // Revenue Breakdown Sheet
      if (data.revenueBreakdown) {
        const revBreakdown = [
          { 'Revenue Source': 'Subscription Fees', 'Amount': `Rs. ${data.revenueBreakdown.subscriptionFees.toLocaleString()}` },
          { 'Revenue Source': 'Setup Fees', 'Amount': `Rs. ${data.revenueBreakdown.setupFees.toLocaleString()}` },
          { 'Revenue Source': 'Late Fees', 'Amount': `Rs. ${data.revenueBreakdown.lateFees.toLocaleString()}` },
          { 'Revenue Source': 'Additional Services', 'Amount': `Rs. ${data.revenueBreakdown.additionalServices.toLocaleString()}` }
        ];
        const revSheet = XLSX.utils.json_to_sheet(revBreakdown);
        XLSX.utils.book_append_sheet(workbook, revSheet, 'Revenue Breakdown');
      }

    } else if (reportType === 'Compliance & Audit Report') {
      // Compliance Metrics Sheet
      const compMetrics = [
        { 'Metric': 'SLA Compliance Rate', 'Value': data.complianceMetrics?.slaComplianceRate || 'N/A', 'Status': 'Current' },
        { 'Metric': 'Regulatory Compliance', 'Value': data.complianceMetrics?.regulatoryCompliance || 'N/A', 'Status': 'Active' },
        { 'Metric': 'Data Security Score', 'Value': data.complianceMetrics?.dataSecurityScore || 'N/A', 'Status': 'Verified' },
        { 'Metric': 'Operational Standards', 'Value': data.complianceMetrics?.operationalStandards || 'N/A', 'Status': 'Certified' },
        { 'Metric': 'Audit Score', 'Value': data.complianceMetrics?.auditScore || 'N/A', 'Status': 'Current' },
        { 'Metric': 'Incident Rate', 'Value': data.complianceMetrics?.incidentRate || 'N/A', 'Status': 'Monitored' }
      ];
      const compSheet = XLSX.utils.json_to_sheet(compMetrics);
      XLSX.utils.book_append_sheet(workbook, compSheet, 'Compliance Metrics');

      // Audit Trail Sheet
      if (data.auditTrail) {
        const auditTrail = [
          { 'Item': 'Last Audit Date', 'Value': data.auditTrail.lastAuditDate || 'N/A' },
          { 'Item': 'Next Audit Due', 'Value': data.auditTrail.nextAuditDue || 'N/A' },
          { 'Item': 'Compliance Officer', 'Value': data.auditTrail.complianceOfficer || 'N/A' },
          { 'Item': 'Certification Status', 'Value': data.auditTrail.certificationStatus || 'N/A' }
        ];
        const auditSheet = XLSX.utils.json_to_sheet(auditTrail);
        XLSX.utils.book_append_sheet(workbook, auditSheet, 'Audit Trail');
      }

      // Network Compliance Sheet
      if (data.networkCompliance && data.networkCompliance.length > 0) {
        const netCompSheet = XLSX.utils.json_to_sheet(data.networkCompliance);
        XLSX.utils.book_append_sheet(workbook, netCompSheet, 'Network Compliance');
      }

    } else {
      // Default General Analytics Report
      const metricsData = [{
        'Total Deliveries': data.totalDeliveries || 0,
        'System SLA': data.systemSLA || 0,
        'Active Networks': data.activeNetworks || 0,
        'Total Riders': data.totalRiders || 0,
        'Collection Centers': data.collectionCenters || 0,
        'Generated Date': new Date().toLocaleDateString()
      }];

      const metricsSheet = XLSX.utils.json_to_sheet(metricsData);
      XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Business Metrics');

      // Network Performance Sheet if available
      if (data.networkPerformance) {
        const networkSheet = XLSX.utils.json_to_sheet(data.networkPerformance);
        XLSX.utils.book_append_sheet(workbook, networkSheet, 'Network Performance');
      }
    }

    // Generate filename based on report type
    const reportTypeSlug = reportType.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileName = `${reportTypeSlug}-${new Date().toISOString().split('T')[0]}.xlsx`;

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }
};

// Comprehensive Billing & Subscription Export Functions
export const exportBillingDataToExcel = (billingData: any, subscriptionsData: any[]) => {
  const workbook = XLSX.utils.book_new();
  
  // Executive Summary Sheet
  const executiveSummary = [{
    'Report Type': 'Billing & Subscription Management Report',
    'Generated Date': new Date().toLocaleDateString(),
    'Generated Time': new Date().toLocaleTimeString(),
    'Total Monthly Revenue': `Rs. ${(billingData.monthlyRevenue || 0).toLocaleString()}`,
    'Total Subscription Revenue': `Rs. ${(billingData.subscriptionRevenue || 0).toLocaleString()}`,
    'Active Subscriptions': subscriptionsData.filter(s => s.status === 'Active').length,
    'Total Networks': subscriptionsData.length,
    'Outstanding Payments': subscriptionsData.filter(s => s.status !== 'Active').length,
    'Compliance Rate': `${Math.round((subscriptionsData.filter(s => s.status === 'Active').length / Math.max(subscriptionsData.length, 1)) * 100)}%`,
    'Report Period': 'Current Month',
    'Generated By': 'TransFleet Operations Dashboard'
  }];
  
  const summarySheet = XLSX.utils.json_to_sheet(executiveSummary);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');
  
  // Hospital Network Subscriptions Sheet
  const networkSubscriptions = subscriptionsData.map(network => ({
    'Network ID': network.networkId || network.id,
    'Network Name': network.networkName || network.name,
    'Admin Name': network.adminName || network.admin_name || 'Not specified',
    'Admin Email': network.adminEmail || network.admin_email || 'Not specified',
    'Admin Phone': network.adminPhone || network.admin_phone || 'Not specified',
    'Subscription Status': network.status || 'Unknown',
    'Monthly Fee': `Rs. ${(network.subscriptionAmount || network.monthlyFee || 75000).toLocaleString()}`,
    'Billing Cycle': network.billingCycle || 'Monthly',
    'Next Payment Date': network.nextPaymentDate ? new Date(network.nextPaymentDate).toLocaleDateString() : 'Not scheduled',
    'Last Payment Date': network.lastPaymentDate ? new Date(network.lastPaymentDate).toLocaleDateString() : 'No payments',
    'Payment Method': network.paymentMethod || 'Bank Transfer',
    'Outstanding Amount': network.outstandingAmount ? `Rs. ${network.outstandingAmount.toLocaleString()}` : 'Rs. 0',
    'Contract Start Date': network.contractStartDate ? new Date(network.contractStartDate).toLocaleDateString() : 'Not specified',
    'Contract End Date': network.contractEndDate ? new Date(network.contractEndDate).toLocaleDateString() : 'Not specified',
    'Active Hospitals': network.hospitalCount || network.hospitals?.length || 0,
    'Total Deliveries': network.totalDeliveries || 0,
    'Account Manager': 'TransFleet Operations',
    'Notes': network.notes || ''
  }));
  
  const subscriptionsSheet = XLSX.utils.json_to_sheet(networkSubscriptions);
  XLSX.utils.book_append_sheet(workbook, subscriptionsSheet, 'Network Subscriptions');
  
  // Revenue Analysis Sheet
  const revenueAnalysis = [
    { 'Revenue Category': 'Active Subscriptions', 'Amount': `Rs. ${(billingData.subscriptionRevenue || 0).toLocaleString()}`, 'Percentage': '85%' },
    { 'Revenue Category': 'Late Fees', 'Amount': `Rs. ${Math.round((billingData.subscriptionRevenue || 0) * 0.05).toLocaleString()}`, 'Percentage': '3%' },
    { 'Revenue Category': 'Setup Fees', 'Amount': `Rs. ${Math.round((billingData.subscriptionRevenue || 0) * 0.08).toLocaleString()}`, 'Percentage': '8%' },
    { 'Revenue Category': 'Additional Services', 'Amount': `Rs. ${Math.round((billingData.subscriptionRevenue || 0) * 0.04).toLocaleString()}`, 'Percentage': '4%' }
  ];
  
  const revenueSheet = XLSX.utils.json_to_sheet(revenueAnalysis);
  XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue Breakdown');
  
  // Payment Status Analysis
  const paymentAnalysis = [
    { 'Status': 'Active Payments', 'Count': subscriptionsData.filter(s => s.status === 'Active').length, 'Revenue Impact': 'Positive' },
    { 'Status': 'Expired Subscriptions', 'Count': subscriptionsData.filter(s => s.status === 'Expired').length, 'Revenue Impact': 'Negative' },
    { 'Status': 'Suspended Services', 'Count': subscriptionsData.filter(s => s.status === 'Suspended').length, 'Revenue Impact': 'Risk' },
    { 'Status': 'Pending Renewals', 'Count': subscriptionsData.filter(s => s.status === 'Expiring Soon').length, 'Revenue Impact': 'Attention Required' }
  ];
  
  const paymentSheet = XLSX.utils.json_to_sheet(paymentAnalysis);
  XLSX.utils.book_append_sheet(workbook, paymentSheet, 'Payment Analysis');
  
  // Generate and download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `primecare-billing-report-${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};

export const exportBillingDataToPDF = async (billingData: any, subscriptionsData: any[]) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Helper function to get proper subscription status
  const getActualSubscriptionStatus = (subscription: any): string => {
    const endDate = subscription.subscriptionEnd || subscription.contractEndDate;
    const status = subscription.subscriptionStatus || subscription.status || 'Active';
    
    if (!endDate) return status;
    
    const now = new Date();
    const end = new Date(endDate);
    
    if (status === 'Suspended') return 'Suspended';
    if (end < now) return 'Expired';
    
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30 && daysLeft > 0) return 'Expiring Soon';
    
    return 'Active';
  };
  
  // Process data correctly
  const processedSubscriptions = subscriptionsData.map(sub => ({
    ...sub,
    actualStatus: getActualSubscriptionStatus(sub),
    networkName: sub.networkName || sub.name || sub.hospital_network || 'Network Name Not Available',
    adminName: sub.adminName || sub.admin_name || 'Admin Not Specified',
    adminEmail: sub.adminEmail || sub.admin_email || 'Email Not Specified',
    monthlyFee: sub.subscriptionAmount || sub.monthlyFee || sub.monthly_fee || 75000,
    nextPayment: sub.nextPaymentDate || sub.next_payment_date || null,
    lastPayment: sub.lastPaymentDate || sub.last_payment_date || null
  }));
  
  const activeCount = processedSubscriptions.filter(s => s.actualStatus === 'Active').length;
  const expiredCount = processedSubscriptions.filter(s => s.actualStatus === 'Expired').length;
  const suspendedCount = processedSubscriptions.filter(s => s.actualStatus === 'Suspended').length;
  const expiringCount = processedSubscriptions.filter(s => s.actualStatus === 'Expiring Soon').length;
  const totalRevenue = processedSubscriptions.reduce((sum, sub) => sum + (sub.monthlyFee || 75000), 0);
  
  // Company Header with Enhanced Design
  pdf.setFillColor(93, 173, 226);
  pdf.rect(0, 0, pageWidth, 45, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  pdf.text('TransFleet Operations', 20, 25);
  
  pdf.setFontSize(16);
  pdf.text('Comprehensive Billing & Subscription Management Report', 20, 38);
  
  // Report Metadata
  let yPosition = 60;
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  
  const currentDate = new Date();
  const reportDetails = [
    `Report Generated: ${currentDate.toLocaleDateString('en-GB')} at ${currentDate.toLocaleTimeString()}`,
    `Report Period: ${currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`,
    `Total Hospital Networks: ${subscriptionsData.length}`,
    `Report Prepared by: TransFleet Operations Team`,
    `Classification: CONFIDENTIAL - For Company Owners Only`
  ];
  
  reportDetails.forEach((detail, index) => {
    if (index === 4) pdf.setTextColor(200, 50, 50); // Red for confidential
    pdf.text(detail, 20, yPosition);
    yPosition += 7;
    pdf.setTextColor(0, 0, 0);
  });
  
  yPosition += 15;
  
  // Executive Summary with Enhanced Metrics
  pdf.setFontSize(20);
  pdf.setTextColor(93, 173, 226);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Summary', 20, yPosition);
  yPosition += 20;
  
  // Enhanced Key Metrics Box
  pdf.setFillColor(248, 250, 252);
  pdf.rect(20, yPosition - 10, pageWidth - 40, 80, 'F');
  pdf.setDrawColor(93, 173, 226);
  pdf.setLineWidth(1);
  pdf.rect(20, yPosition - 10, pageWidth - 40, 80, 'S');
  
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  
  const enhancedMetrics = [
    `Total Monthly Recurring Revenue: Rs. ${totalRevenue.toLocaleString()}`,
    `Monthly Revenue (Billed): Rs. ${(billingData.monthlyRevenue || totalRevenue).toLocaleString()}`,
    `Subscription Revenue: Rs. ${(billingData.subscriptionRevenue || totalRevenue).toLocaleString()}`,
    `Active Paying Networks: ${activeCount} of ${subscriptionsData.length} (${Math.round((activeCount / Math.max(subscriptionsData.length, 1)) * 100)}%)`,
    `Payment Compliance Rate: ${Math.round((activeCount / Math.max(subscriptionsData.length, 1)) * 100)}%`,
    `Average Revenue per Network: Rs. ${Math.round(totalRevenue / Math.max(subscriptionsData.length, 1)).toLocaleString()}`
  ];
  
  enhancedMetrics.forEach((metric, index) => {
    pdf.setFontSize(12);
    pdf.text(metric, 30, yPosition + (index * 10));
  });
  
  yPosition += 95;
  
  // Detailed Subscription Status Analysis
  pdf.setFontSize(18);
  pdf.setTextColor(93, 173, 226);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Subscription Portfolio Analysis', 20, yPosition);
  yPosition += 20;
  
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  
  const detailedStatus = [
    `[ACTIVE] Active Subscriptions: ${activeCount} networks (Rs. ${(activeCount * 75000).toLocaleString()}/month)`,
    `[WARNING] Expiring Soon: ${expiringCount} networks (${Math.round((expiringCount / Math.max(subscriptionsData.length, 1)) * 100)}% of portfolio)`,
    `[CRITICAL] Expired Subscriptions: ${expiredCount} networks (Lost revenue: Rs. ${(expiredCount * 75000).toLocaleString()}/month)`,
    `[SUSPENDED] Suspended Services: ${suspendedCount} networks (Recovery opportunity: Rs. ${(suspendedCount * 75000).toLocaleString()}/month)`,
    `[HEALTH] Portfolio Health Score: ${Math.round(((activeCount + expiringCount) / Math.max(subscriptionsData.length, 1)) * 100)}%`
  ];
  
  detailedStatus.forEach((status, index) => {
    const color = index === 0 ? [34, 197, 94] : index === 1 ? [251, 191, 36] : index === 2 ? [239, 68, 68] : index === 3 ? [156, 163, 175] : [59, 130, 246];
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.text(status, 20, yPosition);
    yPosition += 10;
  });
  
  // Financial Impact Analysis
  yPosition += 10;
  pdf.setFontSize(16);
  pdf.setTextColor(93, 173, 226);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Financial Impact Analysis', 20, yPosition);
  yPosition += 15;
  
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  
  const potentialRevenue = subscriptionsData.length * 75000;
  const actualRevenue = activeCount * 75000;
  const lostRevenue = potentialRevenue - actualRevenue;
  
  const financialAnalysis = [
    `Potential Monthly Revenue (100% active): Rs. ${potentialRevenue.toLocaleString()}`,
    `Current Monthly Revenue: Rs. ${actualRevenue.toLocaleString()}`,
    `Revenue Gap: Rs. ${lostRevenue.toLocaleString()} (${Math.round((lostRevenue/potentialRevenue) * 100)}% opportunity)`,
    `Recovery Target: ${expiredCount + suspendedCount} networks worth Rs. ${((expiredCount + suspendedCount) * 75000).toLocaleString()}/month`
  ];
  
  financialAnalysis.forEach(analysis => {
    pdf.text(analysis, 20, yPosition);
    yPosition += 8;
  });
  
  // New page for detailed network subscriptions
  pdf.addPage();
  yPosition = 30;
  
  pdf.setFontSize(20);
  pdf.setTextColor(93, 173, 226);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Detailed Network Subscriptions', 20, yPosition);
  yPosition += 20;
  
  // Enhanced table headers
  const headers = ['Network Name', 'Admin Contact', 'Status', 'Monthly Fee', 'Next Payment'];
  const colWidths = [45, 35, 25, 25, 35]; // Custom column widths
  let xPosition = 20;
  
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.setFillColor(93, 173, 226);
  pdf.rect(20, yPosition - 5, pageWidth - 40, 12, 'F');
  
  headers.forEach((header, index) => {
    pdf.text(header, xPosition + 2, yPosition + 3);
    xPosition += colWidths[index];
  });
  
  yPosition += 12;
  pdf.setTextColor(0, 0, 0);
  
  // Enhanced table data with more information
  processedSubscriptions.slice(0, 20).forEach((network, index) => {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 30;
      
      // Repeat headers on new page
      xPosition = 20;
      pdf.setTextColor(255, 255, 255);
      pdf.setFillColor(93, 173, 226);
      pdf.rect(20, yPosition - 5, pageWidth - 40, 12, 'F');
      headers.forEach((header, index) => {
        pdf.text(header, xPosition + 2, yPosition + 3);
        xPosition += colWidths[index];
      });
      yPosition += 12;
      pdf.setTextColor(0, 0, 0);
    }
    
    xPosition = 20;
    const rowData = [
      network.networkName.substring(0, 18),
      (network.adminName || 'Not specified').substring(0, 15),
      network.actualStatus,
      `Rs. ${network.monthlyFee.toLocaleString()}`,
      network.nextPayment ? new Date(network.nextPayment).toLocaleDateString('en-GB') : 'Not scheduled'
    ];
    
    // Alternate row background
    if (index % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(20, yPosition - 2, pageWidth - 40, 10, 'F');
    }
    
    // Status color coding
    const statusColors = {
      'Active': [34, 197, 94],
      'Expiring Soon': [251, 191, 36],
      'Expired': [239, 68, 68],
      'Suspended': [156, 163, 175]
    };
    
    rowData.forEach((cell, cellIndex) => {
      if (cellIndex === 2) { // Status column
        const color = statusColors[cell as keyof typeof statusColors] || [0, 0, 0];
        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
      }
      pdf.text(cell, xPosition + 2, yPosition + 3);
      xPosition += colWidths[cellIndex];
    });
    
    yPosition += 10;
  });
  
  // Enhanced Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text('CONFIDENTIAL - TransFleet Operations Financial Report', 20, pageHeight - 20);
  pdf.text(`Generated on ${new Date().toLocaleString()} | For Company Owners Only`, 20, pageHeight - 12);
  pdf.text(`Total Networks: ${subscriptionsData.length} | Active: ${activeCount} | Revenue: Rs. ${totalRevenue.toLocaleString()}/month`, pageWidth - 140, pageHeight - 12);
  
  pdf.save(`primecare-comprehensive-billing-report-${new Date().toISOString().split('T')[0]}.pdf`);
};