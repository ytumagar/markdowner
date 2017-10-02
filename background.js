var md = '';
chrome.contextMenus.create({
    title: "Markdowner (Ctrl+Shift+1)",
    contexts: ["selection"],
    onclick: copyMD
});

// Shortcut key handler
chrome.commands.onCommand.addListener(function(command) {
    console.log('onCommand: ', command);
  if (command === 'getMarkdown'){
    chrome.tabs.getSelected(null, function(tab) {
        copyMD(null, tab);
    });
  }
});

function copyMD(info, tab) {
        chrome.tabs.sendRequest(tab.id, {msg: "getMarkdown"}, function(response) {
            console.log(tab.url);
            md = JSON.parse(response.md);
            md = cleanMD(md, tab.url);
            var textArea = document.createElement("textarea");
            document.body.appendChild(textArea);
            textArea.value = md;
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);            
        });
}

function cleanMD(md, url){
    md = md.replace(/^( |\t)*/mg,'');
    md = md.replace(/^`/mg,'').replace(/`$/mg,'').replace(/~~~/mg,'\t');
    md = md.replace(/^\* *$/mg,'');
    md = md.replace(/^\d$/mg,'');
    md = md.replace(/$/,'\n\n---\n');
    md = md.replace(/^/,' ');

    if (/\.impress\.co\.jp/.test(url)){
        md = md.replace(/_s\.(jpg|JPG|png|PNG|gif|GIF)/g,
                //function(){ return '.' + RegExp.$1;} 
                function(){ return '.jpg';}
            );
    } else if (/autoc-one\.jp/.test(url)){
        md = md.replace(/_[tl]\.(jpg|JPG|png|PNG|gif|GIF)/g,
                function(){ return '_o.' + RegExp.$1;}
            );
        md = md.replace(/\*\s*\[/g,'[');
    } else if (/trendy\.nikkeibp\.co\.jp/.test(url)){
        md = md.replace(/thumb_\d+_/g, '');
    } else if (/gazoo\.com\/car/.test(url)){
        md = md.replace(/\?renditionid=\d+/g, '');
    } else if (/www\.webcg\.net/.test(url)){
        md = md.replace(/\/\d+\/img_/g, '/-/img_');
    }

    return md;
}