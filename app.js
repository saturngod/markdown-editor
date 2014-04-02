 var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
    navigator.saveBlob = navigator.saveBlob || navigator.msSaveBlob || navigator.mozSaveBlob || navigator.webkitSaveBlob;
    window.saveAs = window.saveAs || window.webkitSaveAs || window.mozSaveAs || window.msSaveAs;

    // Because highlight.js is a bit awkward at times
    var languageOverrides = {
      js: 'javascript',
      html: 'xml',
      php: 'php'
    }

    marked.setOptions({
      highlight: function(code, lang){
        if(languageOverrides[lang]) lang = languageOverrides[lang];
        return hljs.LANGUAGES[lang] ? hljs.highlight(lang, code).value : code;
      }
    });

    function update(e){
      var val = e.getValue();

      setOutput(val);

      clearTimeout(hashto);
      hashto = setTimeout(updateHash, 1000);
    }

    function setOutput(val){
      val = val.replace(/<equation>((.*?\n)*?.*?)<\/equation>/ig, function(a, b){
        return '<img src="http://latex.codecogs.com/png.latex?' + encodeURIComponent(b) + '" />';
      });

      document.getElementById('out').innerHTML = marked(val);
    }

    var editor = CodeMirror.fromTextArea(document.getElementById('code'), {
      mode : "gfm",
      lineNumbers: true,
      matchBrackets: true,
      lineWrapping: true,
      theme: 'default',
    });

    editor.on("change", function() {
        updatePreview();
      });

    function updatePreview()
    {
      update(editor);
    }
    document.addEventListener('drop', function(e){
      e.preventDefault();
      e.stopPropagation();

      var theFile = e.dataTransfer.files[0];
      var theReader = new FileReader();
      theReader.onload = function(e){
        editor.setValue(e.target.result);
      };

      theReader.readAsText(theFile);
    }, false);

    function save(){
      var code = editor.getValue();
      var blob = new Blob([code], { type: 'text/plain' });
      saveBlob(blob,"md");
    }

    function downloadHTML()
    {
        var code = document.getElementById('sourceHTML').value ;
        var blob = new Blob([code], { type: 'text/html' });
        saveBlob(blob,"html");
    }

    function saveBlob(blob,ext){
      var name = "untitled."+ext;
      if(window.saveAs){
        window.saveAs(blob, name);
      }else if(navigator.saveBlob){
        navigator.saveBlob(blob, name);
      }else{
        url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.setAttribute("href",url);
        link.setAttribute("download",name);
        var event = document.createEvent('MouseEvents');
        event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
        link.dispatchEvent(event);
      }
    }

    document.addEventListener('keydown', function(e){
      if(e.keyCode == 83 && (e.ctrlKey || e.metaKey)){
        e.preventDefault();
        save();
        return false;
      }
    })

    var hashto;

    function updateHash(){
      window.location.hash = btoa(RawDeflate.deflate(unescape(encodeURIComponent(editor.getValue()))));

      updateStorage();

    }

    function updateStorage()
    {
      if(is_chrome_stroage())
      {
        chrome.storage.sync.set({'markdown': btoa(RawDeflate.deflate(unescape(encodeURIComponent(editor.getValue()))))}, function() {
        });
      }
      else if(supports_html5_storage())
      {
        localStorage.setItem("markdown",btoa(RawDeflate.deflate(unescape(encodeURIComponent(editor.getValue())))));
      }
    }

    var markdownData = "";
    if(is_chrome_stroage())
    {
      chrome.storage.sync.get('markdown',function(value){
        markdownData = value.markdown;
         if(markdownData!=""){
          editor.setValue(decodeURIComponent(escape(RawDeflate.inflate(atob(markdownData)))));
          update(editor);
          editor.focus();
         }
      });
    }
    else if(supports_html5_storage())
    {
      markdownData = localStorage.getItem("markdown");
      if(markdownData === null)
      {
        markdownData = ""; //item not exist , put empty string
      }
    }

    if(window.location.hash){
      var h = window.location.hash.replace(/^#/, '');
      if(h.slice(0,5) == 'view:'){
        setOutput(decodeURIComponent(escape(RawDeflate.inflate(atob(h.slice(5))))));
        document.body.className = 'view';
      }else{
        editor.setValue(decodeURIComponent(escape(RawDeflate.inflate(atob(h)))))
        update(editor);
        editor.focus();
      }
    }
    else if(markdownData!="")
    {
        //show saved data
        editor.setValue(decodeURIComponent(escape(RawDeflate.inflate(atob(markdownData)))));
        update(editor);
        editor.focus();
    }
    else{
      update(editor);
      editor.focus();
    }

document.getElementById("downloadHTML").onclick = function ()
{
    downloadHTML();
}

document.getElementById("copy").onclick = function ()
{

  document.getElementById('editorCode').hidden = !document.getElementById('editorCode').hidden;

  var val = editor.getValue();

  val = val.replace(/<equation>((.*?\n)*?.*?)<\/equation>/ig, function(a, b){
  return '<img src="http://latex.codecogs.com/png.latex?' + encodeURIComponent(b) + '" />';
  });
  document.getElementById('sourceHTML').value = marked(val);
      

}
    
document.getElementById('editorCode').hidden = true;


function supports_html5_storage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

function is_chrome_stroage()
{
  return !(typeof chrome.storage === 'undefined')
}

