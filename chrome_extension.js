chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
	var md = getMarkdown();

    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.msg == "getMarkdown")
      sendResponse({md: JSON.stringify(md)});
    else
      sendResponse({}); // snub them.
  }
);

