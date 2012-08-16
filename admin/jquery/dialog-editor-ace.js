var editor_file = ""; // das muss gesetzt werden beim öfnen des editors
var dialog_editor = false;
var editor;
var editor_session;
var ace_width_test_string = '<pre id="ace_width_test_string" class="ace_editor">WWWWWWWWWW</pre>';

function send_editor_data(para,savepage) {
    if(para.substring(0, 1) != "&")
        para = "&"+para;
    para = "action="+action_activ+para; //escape()
//$("#out").html($("#out").html()+"<br />savepage= "+para);
    $.ajax({
        global: true,
        cache: false,
        type: "POST",
        url: "index.php",
        data: para,
        async: true,
        dataType: "html",// html
        // timeout geht nur bei async: true und ist in error und complete verfügbar
        timeout:20000,
        beforeSend: function(jqXHR) {
            $(dialog_editor).data("send_object",jqXHR);
            // das dient dazu das der error dialog nich aufgeht
            $(dialog_editor).data("send_abort",false);
            dialog_open("editor_send_cancel");
        },
        success: function(getdata, textStatus, jqXHR){
            if($(dialog_multi).dialog("isOpen")) {
                $(dialog_multi).dialog("close");
            }
//$("#out").html($("#out").html()+"<br />success");
            // Achtung vom server muss immer ein tag zurückkommen
            getdata = clean_data(getdata);
            if(retError !== false) {
//$("#out").html($("#out").html()+"<br />error_messages"+retError.html());
                dialog_open("from_php",retError);
            } else if(retSuccess !== false) {
//$("#out").html($("#out").html()+"<br />dialog_messages="+retSuccess.length);
                // nur öffnen wenn es auch einen inhalt gibt
                if(retSuccess.text().length > 5) {
                    dialog_open("from_php",retSuccess);
                }
                if(!savepage && pagecontent !== false) {
//$("#out").html($("#out").html()+"<br />open");
//                    $("#" + meditorID).text(pagecontent);
                    $(dialog_editor).dialog("open");
editor_session.setValue(pagecontent);
init_ace_editor(); //pagecontent
                    $(dialog_editor).data("diffcontent",pagecontent);
                }

                if(savepage)
//editor_session.getValue();
                    $(dialog_editor).data("diffcontent",editor_session.getValue());
                // beim config wird nee select mit geschickt die müssen wir mit dem original ersetzen
                if(replace_item !== false) {
                    repalce_tags(replace_item);
                }
            } else {
               dialog_open("error","unbekanter fehler");
            }
            $(dialog_editor).data("send_object",false);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            if($(dialog_multi).dialog("isOpen")) {
                $(dialog_multi).dialog("close");
            }
            $(dialog_editor).data("send_object",false);
            if(!$(dialog_editor).data("send_abort")) {
                dialog_open("error_messages","status= " + textStatus + "\nerror:\n" + errorThrown);
            }
        },
    });
}


function dialog_editor_send_cancel() {
    $(dialog_multi).css("background", "url(" + icons_src + "ajax-loader.gif) center center no-repeat");
    $(dialog_multi).dialog( "option", "title", mozilo_lang["dialog_title_send"]);
    $(dialog_multi).dialog( "option", "buttons", [{
        text: mozilo_lang["button_cancel"],
        click: function() {
            $(dialog_editor).data("send_abort",true);
            $(dialog_editor).data("send_object").abort();
            $(this).dialog("close");
        }
    }]);
}

function dialog_editor_save_beforclose() {
    $(dialog_multi).dialog( "option", "title", mozilo_lang["dialog_title_save_beforeclose"]);
    var inhalt = "<p><span class=\"ui-icon ui-icon-alert\" style=\"float:left; margin:0 7px 20px 0;\">&nbsp;</span>Soll sie jetzt gespeichert werden?</p>";
    $(dialog_multi).html(inhalt);
    $(dialog_multi).dialog( "option", "buttons", [{
        text: mozilo_lang["button_save"],
        click: function() {
            send_editor_data(editor_file+"&content="+rawurlencode_js(editor_session.getValue()),true);
            $(this).dialog("close");
        }
    },{
        text: mozilo_lang["button_cancel"],
        click: function() { $(this).dialog("close"); }
    },{
        text: mozilo_lang["page_edit_discard"],
        click: function() {
            $(dialog_editor).data("diffcontent",false);
            $(dialog_editor).dialog("close");
            $(this).dialog("close");
        }
    }]);
}

function insert_ace(aTag, eTag, select) {
    var test_range = editor_session.selection.rangeList,
        range_ace = [],
        tmp_start = 0,
        tmp_end = 0;
    if(test_range.ranges.length == 0) {
        range_ace[0] = editor.getSelectionRange();
    } else {
        for (var i = 0; i < test_range.ranges.length; i++) {
            range_ace[i] = test_range.ranges[i];
        }
    }
    editor.exitMultiSelectMode();
    var row_column_offset = 0;
    for(var i = 0; i < range_ace.length; i++) {
        tmp_start = range_ace[i].start.column;
        tmp_end = range_ace[i].end.column;
        // wenn was selectet ist überschreiben wir select
        if(range_ace[i].start.column < range_ace[i].end.column)
            select = true;
        var selectet = editor_session.doc.getTextRange(range_ace[i]);
        if(eTag) {
            editor_session.doc.replace(range_ace[i], aTag+selectet+eTag)
            var end_column = aTag.length;
            if(range_ace[i].start.row < range_ace[i].end.row)
                end_column = 0;
            range_ace[i].start.column += aTag.length;
            range_ace[i].end.column += end_column;
        } else {
            editor_session.doc.replace(range_ace[i], aTag)
            range_ace[i].end.column = range_ace[i].start.column + aTag.length;
            range_ace[i].end.row = range_ace[i].start.row;
        }
        if(select) {
            if(i == 0)
                // das selectierte wieder selectioeren, setzt auch den cursor ins element
                editor_session.selection.setSelectionRange(range_ace[i],false)
            editor_session.selection.addRange(range_ace[i], false)
            // offset der nächsten selection setzen
            if(typeof range_ace[(i + 1)] != "undefined") {
                var e_tag = 0;
                if(eTag)
                    e_tag = eTag.length;
                if(range_ace[i].start.row == range_ace[(i + 1)].start.row) {
                    row_column_offset += (range_ace[i].start.column - tmp_start)
                        + ((range_ace[i].end.column - range_ace[i].start.column) - (tmp_end - tmp_start))
                        + e_tag;
                    range_ace[(i + 1)].start.column = range_ace[(i + 1)].start.column + row_column_offset;
                    range_ace[(i + 1)].end.column = range_ace[(i + 1)].end.column + row_column_offset;
                } else
                    row_column_offset = 0
            }
        }
    }
    editor.focus();
}

function init_ace_editor() { // pagecontent
//$("#out").html($("#out").html()+"<br>box="+$('#pagecontent-border').width());
    var box_height = $('#pageedit-box-inhalt').height(),
        new_width = $('#pagecontent-border').width(),
        mo_syntax_box = 0;
    if($('#js-editor-toolbar').css('display') != "none")
        mo_syntax_box = $('#js-editor-toolbar').outerHeight(true);

    var new_height = (box_height - mo_syntax_box - $('#ace-menu-box').outerHeight(true) - 2);

    $('#pagecontent-border').height(new_height);

    $('#'+meditorID).height(new_height);
    $('#'+meditorID).width((new_width - 2));
    editor.resize();
    window.setTimeout("set_ace_WrapLimitRange()", 50);
    // !!!!!!!!! damit die zeilen nummern bis unten sichtbar sind
    // ace.js ca. zeile 15461 this.$gutter.style.height = (offset + this.$size.scrollerHeight) + "px";
    editor.focus();
}

function set_ace_WrapLimitRange() {
    ace_width_test_string.css('font-size',$('#select-fontsize').val());
    var character_max = (ace_width_test_string.width() / 10);
    character_max = Math.round($("#"+meditorID+" .ace_scroller").width() / character_max) - 3;
    editor_session.setWrapLimitRange(character_max, character_max);
}

function set_editor_settings() {
    if(navigator.cookieEnabled == true) {
        var cookieablauftage = 50;
        var ablauf = new Date();
        var cookielifetime = ablauf.getTime() + (cookieablauftage * 24 * 60 * 60 * 1000);
        ablauf.setTime(cookielifetime);

        var settings = set_icon_checked($('#show_gutter'),false)+",";
        settings += set_icon_checked($('#show_hidden'),false)+",";
        if($('#select-mode').val() == "text")
            settings += $('#select-mode').val()+",";
        else
            settings += "mozilo,";
        settings += $('#select-fontsize').val();
        document.cookie = "mozilo_editor_settings=" + settings + "; expires=" + ablauf.toGMTString();
    }
}

function get_editor_settings() {
    // set default
    $('#select-mode option[value="mozilo"]').attr('selected',true)
    $('#select-fontsize option[value="12px"]').attr('selected',true)
    $('#show_gutter').addClass('ui-state-active');
    if(navigator.cookieEnabled == true) {
        if(document.cookie && document.cookie.match(/mozilo_editor_settings=[^;]+/i)) {
            var settings = document.cookie.match(/mozilo_editor_settings=[^;]+/i)[0].split("=")[1].split(",");
//$("#out").html($("#out").html()+"<br>get_cookie = "+settings[0]+","+settings[1]+","+settings[2]+","+settings[3]+",");

            if(settings[0] == "true")
                $('#show_gutter').addClass('ui-state-active')
            if(settings[1] == "true")
                $('#show_hidden').addClass('ui-state-active')
            if(settings[2] == "text") {
                $('#select-mode option:selected').attr('selected',false);
                $('#select-mode option[value="'+settings[2]+'"]').attr('selected',true);
            }
            $('#select-fontsize option:selected').attr('selected',false);
            $('#select-fontsize option[value="'+settings[3]+'"]').attr('selected',true);
        } else {
            set_editor_settings();
        }
    }
};

function set_icon_checked(item,setcss) {
    if(setcss && !item.hasClass('ui-state-active'))
        item.addClass('ui-state-active');
    else if(setcss && item.hasClass('ui-state-active'))
        item.removeClass('ui-state-active');

    var return_set = false;
    if(item.hasClass('ui-state-active'))
        return_set = true
    return return_set;
}

$(function() {

    ace_width_test_string = $(ace_width_test_string).css({'margin':0,'padding':0,'position':'relative','float':'left'});
    $('#dialog-test-w').parent().prepend(ace_width_test_string);

    get_editor_settings();
    editor = ace.edit(meditorID);
    editor.setTheme("ace/theme/mozilo");
    editor.setFontSize($('#select-fontsize').val());
    editor.setSelectionStyle("line"); // "line" "text"
    editor.setShowFoldWidgets(true);
    editor_session = editor.getSession();
    editor_session.setMode("ace/mode/"+$('#select-mode').val());
    editor_session.setUseWrapMode(true);
    editor_session.setWrapLimitRange(80, 80);
    editor_session.setTabSize(4);

    editor.renderer.setShowPrintMargin(false);
    // Achtung in die admin.css muss div.ace_scroller { overflow-x: hidden; } sonst gehts nicht
    editor.renderer.setHScrollBarAlwaysVisible(false);

    editor.renderer.setShowGutter(set_icon_checked($('#show_gutter'),false));
    editor.setShowInvisibles(set_icon_checked($('#show_hidden'),false));
    editor.destroy();

    // der opera hat probleme mit den bold sachen im ace editor
    // älterer firefox auch
//     if(navigator.appName.toLowerCase() == "opera") {
        $('.ace_editor').css('font-family','monospace');
//     }

    $('#show_gutter').bind('click', function() {
        editor.renderer.setShowGutter(set_icon_checked($(this),true));
        editor.focus();
        set_ace_WrapLimitRange();
        set_editor_settings();
    });

    $('#show_hidden').bind('click', function() {
        editor.setShowInvisibles(set_icon_checked($(this),true));
        editor.focus();
        set_editor_settings();
    });

    $('#select-mode').bind('change', function() {
        editor_session.setMode("ace/mode/"+$(this).val());
        editor.focus();
        set_editor_settings();
    });

    $('#select-fontsize').bind('change', function() {
        editor.setFontSize($(this).val());
        set_ace_WrapLimitRange();
        editor.focus();
        set_editor_settings();
    });

    $('#toggle_fold').bind('click', function() {
        editor_session.toggleFold();
        editor.focus();
    });

    $('#search').bind('click', function() {
        if($('#search-text').val() == "")
            return;
        editor.exitMultiSelectMode();
        if($('#search-all').prop("checked")) {
            editor.findAll($('#search-text').val());
        } else {
            editor.find($('#search-text').val());
        }
        editor.centerSelection();
        editor.focus();
    });

    $('#replace').bind('click', function() {
        if($('#replace-text').val() != "" && !editor_session.selection.isEmpty())
            insert_ace($('#replace-text').val(), false, true);
        else
            editor.focus();
    });

    $('#undo').bind('click', function(event) {
        editor_session.getUndoManager().undo(true);
        editor.exitMultiSelectMode();
        editor.focus();
    });
    $('#redo').bind('click', function(event) {
        editor_session.getUndoManager().redo(true);
        editor.exitMultiSelectMode();
        editor.focus();
    });

    $("#pageedit-box").dialog({
        autoOpen: false,
        height: "auto",
        width: "auto",
        modal: true,
        position: "center",
        resizable: true,
//        dialogClass: "mo-td-content-width",
        create: function(event, ui) {
            $(this).data("send_object",false);

            dialog_editor = this;
            $('#js-ace-color-img').css('display','none');
            $(this).parents('.ui-dialog').find('.ui-dialog-titlebar').prepend($(this).find('.js-docu-link'));

            window.setTimeout('set_dialog_max_width("#pageedit-box")', 100);
        },
        beforeClose: function(event, ui) {
            // hat sich die Inhaltseite geändert
            if($(this).data("diffcontent") !== false && $(this).data("diffcontent") != editor_session.getValue()) {
                dialog_open("editor_save_beforclose");
                    event.preventDefault();
            }

        },
        buttons: [{
            text: mozilo_lang["button_save"],
            click: function() {
                send_editor_data(editor_file+"&content="+rawurlencode_js(editor_session.getValue()),true);
            }
        }],
        close: function(event, ui) {
            $("#menu-fix-close-editor").show(0).attr("id","menu-fix");
            if($(this).data("send_object"))
                $(this).data("send_object").abort();
            $(this).data("send_object",false);
            editor_file = "";
            editor_session.setValue("dummy");
            editor.destroy();
            $(this).data("diffcontent",false);
            $('#js-ace-color-img').css('display','none');
            if(!$(".box-farbtastic").hasClass("fb-box-close")) {
                $(".box-farbtastic").addClass("fb-box-close");
                $(".box-farbtastic").css('display','none');
                $(".colorimage").addClass("ui-state-default").removeClass("ui-state-active");
            }
        },
        open: function(event, ui) {
//$("#out").html($("#out").html()+"<br />dialogopen");
            $("#menu-fix").hide(0).attr("id","menu-fix-close-editor");
            $('.overviewselect, .usersyntaxselectbox').multiselect( "option", "maxHeight", $("#"+meditorID).closest('td').outerHeight() + $(this).next('.ui-dialog-buttonpane').height());
            // ein hack das die select grösse stimt
            $('select[name="select-mode"]').closest('div').width($('select[name="select-mode"]').outerWidth())
            $('select[name="select-fontsize"]').closest('div').width($('select[name="select-fontsize"]').outerWidth())
            // das ist wichtig da erst dann die button breite bekant ist
            $('.overviewselect, .usersyntaxselectbox, .js-ace-select').multiselect("refresh");

        },//Stop
        resize: function(event, ui) {
            init_ace_editor();
        }
    });

    //farbtastic
    if($(".box-farbtastic").length > 0) {
        var picker = $.farbtastic(".box-farbtastic",".fb-color-change");
            picker.setColor("FF0000");
        $(".box-farbtastic").addClass("fb-box-close");
        $(".box-farbtastic").css('display','none');
        $(".colorimage").bind({
            click: function () {
                if($(".box-farbtastic").hasClass("fb-box-close")) {
                    $(".fb-color-curent").css("background-color", "#"+$("#farbcode").val())
                    $(".box-farbtastic").removeClass("fb-box-close");
                    $(".box-farbtastic").show(anim_speed);
                    $(this).addClass("ui-state-active").removeClass("ui-state-default");
                } else {
                    $(".box-farbtastic").addClass("fb-box-close");
                    $(".box-farbtastic").hide(anim_speed);
                    $(this).addClass("ui-state-default").removeClass("ui-state-active");
                }
            },
            mouseenter: function() {
                $(this).addClass("ui-state-hover").removeClass("ui-state-default");
            },
            mouseleave: function () {
                $(this).removeClass("ui-state-hover").addClass("ui-state-default");
            }
        });
    }

    $('.overviewselect, .usersyntaxselectbox').multiselect({
        multiple: false,
        showClose: false,
        showSelectAll:false,
        closeOptgrouptoggle: false,
        noneSelectedText: false,
        selectedList: 0,
        selectedText: function(numChecked, numTotal, checkedItems) {
            $(this.labels).removeClass("ui-state-highlight ui-state-hover");
            return $(this.element).attr("title");
        },
    }).multiselectfilter();

    $('select[name="template_css"], select[name="platzhalter"]').multiselect({
        click: function(event, ui){
            insert_ace(ui.value,false,false);
        },
    });

    $('select[name="files"], select[name="gals"]').multiselect({
        click: function(event, ui){
            insert_ace(FILE_START+ui.value+FILE_END,false,false);
        },
    });

    $('select[name="pages"]').multiselect({
        closeOptgrouptoggle: true,
        click: function(event, ui){
            insert_ace(FILE_START+ui.value+FILE_END,false,false);
        },
        optgrouptoggle: function(event, ui){
            insert_ace(FILE_START+ui.label+FILE_END,false,false);
        },
    });

    $('select[name="usersyntax"]').multiselect({
        click: function(event, ui){
            // [user syntax|...] und [user syntax=|...] nur {VALUE} wird ersetzt
            if (ui.value.search(/\|\.\.\.\]/) != -1) {
                insert_ace(ui.value.substring(0, ui.value.length-4), ']',true);
            }
            // [user syntax=|] nur {DESCRIPTION} wird ersetzt da keine {VALUE}
            else if (ui.value.search(/\=\.\.\.\|\]/) != -1) {
                insert_ace(ui.value.substring(0, ui.value.length-5), '|]',true);
            }
            // [user syntax] kein {DESCRIPTION} und {VALUE} [user syntax] wird eingesetzt
            else {
                insert_ace(ui.value,false,false);
            }
       },
    });

    $('select[name="plugins"]').multiselect({
        click: function(event, ui){
            // {PLUGIN|}
            if (ui.value.search(/\|\}/) != -1) {
                insert_ace(ui.value.substring(0, ui.value.length-1), '}',true);
            }
            // {PLUGIN|wert}
            else if (ui.value.search(/\|/) != -1) {
                insert_ace(ui.value,false,true);
            } 
            // {PLUGIN}
            else {
                insert_ace(ui.value,false,false);
            }
       },

    });

    $('.js-ace-select').multiselect({
        multiple: false,
        showClose: false,
        showSelectAll:false,
        noneSelectedText: false,
        minWidth: 20,
        selectedList: 1,
    });

    $('#pageedit-box').on({
        mouseenter: function() { 
            $(this).addClass("ui-state-hover").removeClass("ui-state-active");
        },
        mouseleave: function () {
            $(this).removeClass("ui-state-hover").addClass("ui-state-active");
        }
    },".ed-syntax-hover");//ui-state-hover ed-syntax-icon

//$(".ui-dialog").show(0);
//$(".box-farbtastic").css('display','block');
//$(".box-farbtastic").hide(0);
});
