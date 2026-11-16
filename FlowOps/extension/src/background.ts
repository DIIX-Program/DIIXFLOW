/**
 * Muse AI Workflow Studio Runner — Background Service Worker (Manifest V3)
 * Orchestrates communication between Web App and Muse Content Script.
 */

let webAppPort: chrome.runtime.Port | null = null;
let museTabPort: chrome.runtime.Port | null = null;
let activeMuseTabId: number | null = null;

// 1. Listen for Web Application connections via externally_connectable
chrome.runtime.onConnectExternal.addListener((port) => {
  if (port.name === 'muse-workflow-bridge') {
    webAppPort = port;

    port.onMessage.addListener(async (msg) => {
      switch (msg.type) {
        case 'GET_STATUS':
          await handleGetStatus(port);
          break;

        case 'START_MUSE_JOB':
          await handleStartJob(msg.payload);
          break;

        case 'CANCEL_MUSE_JOB':
          museTabPort?.postMessage({ type: 'CANCEL_JOB', jobId: msg.jobId });
          break;
      }
    });

    port.onDisconnect.addListener(() => {
      webAppPort = null;
    });
  }
});

// 2. Listen for Muse Tab Content Script connections
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'muse-dom-adapter') {
    museTabPort = port;
    if (port.sender?.tab?.id) {
      activeMuseTabId = port.sender.tab.id;
    }

    port.onMessage.addListener((msg) => {
      // Forward all updates, chunks, and completion signals directly to Web App port
      if (webAppPort) {
        webAppPort.postMessage(msg);
      }
    });

    port.onDisconnect.addListener(() => {
      museTabPort = null;
    });
  }
});

async function findOrCreateMuseTab(): Promise<number> {
  const tabs = await chrome.tabs.query({ url: ['https://muse.ai/*', 'https://*.muse.ai/*'] });
  if (tabs.length > 0 && tabs[0].id) {
    activeMuseTabId = tabs[0].id;
    await chrome.tabs.update(activeMuseTabId, { active: true });
    return activeMuseTabId;
  }

  const newTab = await chrome.tabs.create({ url: 'https://muse.ai/', active: true });
  activeMuseTabId = newTab.id || null;
  return newTab.id!;
}

async function handleGetStatus(replyPort: chrome.runtime.Port) {
  const tabs = await chrome.tabs.query({ url: ['https://muse.ai/*', 'https://*.muse.ai/*'] });
  const hasTab = tabs.length > 0;

  replyPort.postMessage({
    type: 'STATUS_RESPONSE',
    extensionReady: true,
    version: '1.0.0',
    museTabFound: hasTab,
    museTabId: hasTab ? tabs[0].id : undefined,
  });
}

async function handleStartJob(payload: any) {
  await findOrCreateMuseTab();

  if (!museTabPort) {
    // If content script has not connected yet, wait up to 4s
    let attempts = 0;
    while (!museTabPort && attempts < 8) {
      await new Promise((r) => setTimeout(r, 500));
      attempts++;
    }
  }

  if (museTabPort) {
    museTabPort.postMessage({
      type: 'EXECUTE_MUSE_JOB',
      payload,
    });
  } else {
    webAppPort?.postMessage({
      type: 'JOB_FAILED',
      jobId: payload.jobId,
      nodeId: payload.nodeId,
      error: 'Muse tab content script not connected. Please ensure https://muse.ai is loaded and logged in.',
    });
  }
}
