define("ace/mode/mozilo",["require","exports","module","ace/lib/oop","ace/mode/text","ace/tokenizer","ace/mode/mozilo_highlight_rules","ace/mode/matching_brace_outdent"],function(a,b,c){"use strict";var d=a("../lib/oop"),e=a("./text").Mode,f=a("../tokenizer").Tokenizer,g=a("./mozilo_highlight_rules").MoziloHighlightRules,h=a("./matching_brace_outdent").MatchingBraceOutdent,i=function(){this.$tokenizer=new f(new g().getRules()),this.$outdent=new h()};d.inherits(i,e),function(){this.getNextLineIndent=function(a,b,c){return a=="intag"?c:""},this.checkOutdent = function(a,b,c){return this.$outdent.checkOutdent(b,c)},this.autoOutdent = function(a,b,c){this.$outdent.autoOutdent(b,c)}}.call(i.prototype),b.Mode=i}),define("ace/mode/mozilo_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"],function(a,b,c){"use strict";var d=a("../lib/oop"),j=a("./text_highlight_rules").TextHighlightRules,g=function(){this.$rules={"start":[{token:"text",regex:"\\^\\[|\\^\\{"},{token:"paren.mo-open",regex:"\\[",next:"msyntax"},{token:"paren.mo-open",regex:"\\{",next:"mplugin_plaze"},{token:"text",regex:"\\^\\]|\\^\\}"},{token:"paren.mo-close",regex:"\\]|\\}"},{token:"mo-sep",regex:"\\|"}],"msyntax":[{token:"mo-syntax",regex:moziloSyntax+"|"+moziloUserSyntax},{token:"paren.mo-close",regex:"\\]",next:"start"},{token:"mo-sep",regex:"\\|",next:"start"},{token:"mo-is",regex:"\\="},{token:"paren.mo-open",regex:"\\[",next:"msyntax"},{token:"paren.mo-open",regex:"\\{",next:"mplugin_plaze"},{token:"mo-sep",regex:"\\|",next:"start"}],"mplugin_plaze":[{token:"mo-pugin-deact",regex:moziloPluginsDeactiv},{token:"mo-pugin-place",regex:moziloPluginsActiv+"|"+moziloPlace},{token:"paren.mo-close",regex:"\\}",next:"start"},{token:"mo-sep",regex:"\\|",next:"start"},{token:"paren.mo-open",regex:"\\[",next:"msyntax"},{token:"paren.mo-open",regex:"\\{",next:"mplugin_plaze"}]}};d.inherits(g,j),b.MoziloHighlightRules=g
}),define("ace/mode/matching_brace_outdent",["require","exports","module","ace/range"],function(a,b,c){"use strict";var d=a("../range").Range,e=function(){};(function(){this.checkOutdent=function(a,b){return/^\s+$/.test(a)?/^\s*\}/.test(b):!1},this.autoOutdent=function(a,b){var c=a.getLine(b),e=c.match(/^(\s*\})/);if(!e)return 0;var f=e[1].length,g=a.findMatchingBracket({row:b,column:f});if(!g||g.row==b)return 0;var h=this.$getIndent(a.getLine(g.row));a.replace(new d(b,0,b,f-1),h)},this.$getIndent=function(a){var b=a.match(/^(\s+)/);return b?b[1]:""}}).call(e.prototype),b.MatchingBraceOutdent=e})
