# Script to safely refactor LeadDetails.jsx
# This script adds the import line and replaces tab JSX with component calls

$filePath = "c:\wamp64\www\latest_crm\travel_opps\frontend\src\pages\LeadDetails.jsx"
$content = Get-Content $filePath -Raw

# Step 1: Add import after html2pdf import
$oldImport = "import html2pdf from 'html2pdf.js';"
$newImport = "import html2pdf from 'html2pdf.js';
import { WhatsAppTab, MailsTab, FollowupsTab, BillingTab, HistoryTab } from '../components/LeadTabs';"

# Also update useState import to add memo,useCallback
$content = $content.Replace(
    "import { useState, useEffect, useMemo } from 'react';",
    "import { useState, useEffect, useMemo, useCallback, memo } from 'react';"
)

$content = $content.Replace($oldImport, $newImport)

# Step 2: Replace WhatsApp tab
# Find start marker: ": activeTab === 'whatsapp' ? ("
# Find end marker before the followups tab  
# We use the unique pattern to replace just this section

$whatsappOld = @"
                    : activeTab === 'whatsapp' ? (
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm text-gray-600">Send and receive WhatsApp messages for this lead. Connect WhatsApp in Settings if messages do not send.</p>
"@

$whatsappNew = @"
                    : activeTab === 'whatsapp' ? (
                      <WhatsAppTab
                        lead={lead}
                        whatsappMessages={whatsappMessages}
                        whatsappInput={whatsappInput}
                        setWhatsappInput={setWhatsappInput}
                        whatsappAttachment={whatsappAttachment}
                        setWhatsappAttachment={setWhatsappAttachment}
                        sendingWhatsapp={sendingWhatsapp}
                        fetchWhatsAppMessages={fetchWhatsAppMessages}
                        handleSendWhatsAppFromTab={handleSendWhatsAppFromTab}
                      />
"@

Write-Host "Writing updated file..."
Set-Content -Path $filePath -Value $content -Encoding UTF8

Write-Host "Done! File size: $((Get-Item $filePath).Length) bytes"
Write-Host "Total lines: $((Get-Content $filePath).Count)"
