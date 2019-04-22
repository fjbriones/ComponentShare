var comp_count = 0;
var rem_count = 0;
var cur_comp;
var components;
var componentJSON;
var componentList;

$.getJSON('http://10.158.3.101:3000/js/components.json', function(data){
    componentJSON = data;
    componentList = Object.keys(data);
})

function componentListFunction(i, item){
    $('#compType' + comp_count).append($('<option>', {
        value: item,
        text: item
    }));
}

function componentDescFunction(key, value){
    $("#compDesc"+cur_comp).append($('<label>', {
        for: key+cur_comp,
        text: " " + key + " "
    }))
    $("#compDesc"+cur_comp).append($('<select>', {
        id: key+cur_comp,
        name: key+cur_comp,
        form: "form",
        class: "form-control"
    }))
    
    $.each(value, function(i, item){
        $("#"+key+cur_comp).append($('<option>', {
            value: item,
            text: item
        }))
    })
}

function componentTypeFunction(){
    var selectedComponent = $(this).children("option:selected").val();
    var parent_id = $(this).parent().attr("id")
    cur_comp = parent_id[parent_id.length - 1];
    var componentDescriptors = componentJSON[selectedComponent];
    $("#compDesc"+cur_comp).empty()
    $.each(componentDescriptors, componentDescFunction)
}

function newComponentFunction(){
    comp_count++;
    cur_comp = comp_count;

    $("#components").append($('<div>', {
        class: "form-group",
        id: "comp" + comp_count,
        style:"display:block"
    }))

    $("#comp"+comp_count).append($('<label>', {
        for: "Quan" + comp_count,
        text: "Quantity: "
    }))
    $("#comp"+comp_count).append($('<input>', {
        id: "Quan" + comp_count,
        name: "Quan" + comp_count,
        form: "form",
        type: "number",
        min: "1",
        max: "100",
        value: "1",
        class: "form-control"
    }))

    $("#comp"+comp_count).append($('<label>', {
        for: "compType" + comp_count,
        text: " Component: "
    }))
    $("#comp"+comp_count).append($('<select>', {
        id: "compType" + comp_count,
        name: "compType" + comp_count,
        form: "form",
        class: "form-control"
    }))
        
    $.each(componentList, componentListFunction)

    $("#comp"+comp_count).append($('<span>', {
        id: "compDesc"+comp_count
    }))

    var selectedComponent = $("#compType"+comp_count).children("option:selected").val();
    var componentDescriptors = componentJSON[selectedComponent];
    $.each(componentDescriptors, componentDescFunction)

    $("#compType"+comp_count).change(componentTypeFunction)

    if(comp_count>=2){
        var init;
        var final;
        if (rem_count==0){
            init = -1;
            final = 0;
        }
        else {
            init = 0;
            final = 0;
        }

        $('#batch').show();

        for(var i = init; i<= final; i++){
            var count = i + comp_count
            $('#comp' + count).append($('<input>', {
                type: "button",
                value: "Remove component",
                id: "remove" + count,
                class: "remove"
            }))
            rem_count++;
            $('#remove' + count).click(function(){
                rem_id = $(this).attr('id');
                rem_comp = rem_id[rem_id.length - 1];
                $('#comp'+rem_comp).remove();
                $(this).remove();
                rem_count--;
                if(rem_count==1){
                    $('.remove').remove();
                    $('#batch').hide();
                    rem_count = 0;
                }
            })
        }
    }
}

$(document).ready(function(){
    // $('#components').append(componentJSON)

    newComponentFunction();
    $('#batch').hide();

    $("#addcomp").click(function(){
        newComponentFunction();
    })
})