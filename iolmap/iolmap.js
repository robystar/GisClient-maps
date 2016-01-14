$(function() {

  var initDialog = function(_, container){
    var elencoVie = [];
    var elencoCivici = [];


    $('select[name="comune"]').select2({
      allowClear: true,
      placeholder: '---'
    }).on("change", function(e) { 
      $.ajax({
        'url':"resources/elencoVie",
        'type':'GET',
        'data':{"comune":$(this).val()},
        'dataType':'JSON',
        'success':function(data, textStatus, jqXHR){
          elencoVie = data.results;
          $('input[name="via"]').select2('data', elencoVie);
          $('input[name="via"]').select2('val', null);
          $('input[name="civico"]').select2('val', null);
          //$("#civico_geometry").val('');
        }
      });
    });


    $('input[name="via"]').select2({
          placeholder: '---',
          allowClear: true,
          minimumInputLength: 2,
          width:'off',      
          query: function (query){
            var data = {results: []};
            var re = RegExp(query.term, 'i');
            $.each(elencoVie, function(){
              if (re.test(this.text)){
                data.results.push({id: this.text, text: this.text, coords: this.coord, idvia:this.id});
              }
            });
            query.callback(data);
        },
        //PER INSERIRE U N VALORE NON IN ELENCO (COMBO EDITABILE)
        createSearchChoice:function(term, data) {
          if ($(data).filter(function() {return this.text.localeCompare(term)===0;}).length===0) {
            return {id:term, text:term};
          } 
        },
        initSelection : function (element, callback) {
          var data ={id: element.val(), text: element.val(), coords:'' } ;
          callback(data);
        }
    }).on("change", function(e){
      //$("#civico_nomevia").val(e.added.text);
      if(!e.added) return;
      $.ajax({
        'url':"resources/elencoCivici",
        'type':'GET',
        'data':{"via":e.added.idvia},
        'dataType':'JSON',
        'success':function(data, textStatus, jqXHR){
          elencoCivici = data.results;
          $('input[name="civico"]').select2('data', elencoCivici);
          $('input[name="civico"]').select2('val', null);
          //$("#civico_geometry").val('');
          if(e.added.coords){
            var v = e.added.coords.split(";");
            var p1 = v[0].split(",");
            var p2 = v[1].split(",");
            var x = parseFloat(p1[0]) + (parseFloat(p2[0]) - parseFloat(p1[0]))/2;
            var y = parseFloat(p1[1]) + (parseFloat(p2[1]) - parseFloat(p1[1]))/2;
            if (x && y){
              $('input[name="coordx"]').val(Math.round(x));
              $('input[name="coordy"]').val(Math.round(y));
            }
          }
        }
      });
    });
    
    $('input[name="civico"]').select2({
          placeholder: '---',
          allowClear: true,
          minimumInputLength: 0,
          width:'off',      
          query: function (query){
            var data = {results: []};
            var re = RegExp('^' + query.term, 'i');
            $.each(elencoCivici, function(){
              if (re.test(this.text)){
                data.results.push({id: this.text, text: this.text, x: this.x, y: this.y});
              }
            });
            query.callback(data);
        },
        //PER INSERIRE U N VALORE NON IN ELENCO (COMBO EDITABILE)
        createSearchChoice:function(term, data) {
          if ($(data).filter(function() {return this.text.localeCompare(term)===0;}).length===0) {
            return {id:term, text:term};
          } 
        },
        initSelection : function (element, callback) {
          var data ={id: element.val(), text: element.val(), x:'', y:'' } ;
          callback(data);
        }
    }).on("change", function(e){
        if(!e.added) return;
        $('input[name="coordx"]').val(Math.round(e.added.x));
        $('input[name="coordy"]').val(Math.round(e.added.y));
    });


 
  }
  

var customCreateControlMarkup = function(control) {
    var button = document.createElement('a'),
        icon = document.createElement('span'),
        textSpan = document.createElement('span');
    //icon.className="myicon glyphicon-white ";
    if(control.tbarpos) button.className += control.tbarpos;
    if(control.iconclass) icon.className += control.iconclass;
    button.appendChild(icon);
    if (control.text) {
        textSpan.innerHTML = control.text;
    }
    button.appendChild(textSpan);
    return button;
};


var initMap = function(){
    var map=this.map;
    //SE HO SETTATO LA NAVIGAZIONE VELOCE????
    if(this.mapsetTiles){
        for(i=0;i<map.layers.length;i++){
            if(!map.layers[i].isBaseLayer && map.layers[i].visibility){
                map.layers[i].setVisibility(false);
                this.activeLayers.push(map.layers[i]);
            }
        }
        
        $(".dataLayersDiv").hide();
        this.mapsetTileLayer.setVisibility(true);
    }

    var editMode = $('input[name="coordx"]').length;
    if(editMode==0){
      $('#center-button').hide();
      map.getControlsByClass("OpenLayers.Control.Navigation")[0].disableZoomWheel();
    } 

    var proj_3003 = new OpenLayers.Projection("EPSG:3003");
    var proj_3857 = new OpenLayers.Projection("EPSG:3857");
    var maxScale = 1000000000;

    var styleBox = new OpenLayers.StyleMap({
            'select': {
                fill: true,
                fillColor: "#ff00FF",
                fillOpacity: 0.1,
                strokeColor: "yellow",
                strokeOpacity: 0.4,
                strokeWidth: 4,
                strokeLinecap: "round",
                pointRadius: 6,
                hoverPointRadius: 1,
                hoverPointUnit: "%",
                pointerEvents: "visiblePainted",
                cursor: "inherit"
            },
            'default': {
                fill: true,
                fillColor: "#ff00FF",
                fillOpacity: 0.2,
                strokeColor: "red",
                strokeOpacity: 1,
                strokeWidth: 4,
                strokeLinecap: "round",
                strokeDashstyle: "solid",
                hoverStrokeColor: "red",
                hoverStrokeOpacity: 1,
                hoverStrokeWidth: 0.4,
                pointRadius: 8,
                hoverPointRadius: 1,
                hoverPointUnit: "%",
                pointerEvents: "visiblePainted",
                cursor: "pointer"
            }
        });




    var btnPrint = new OpenLayers.Control.PrintMap({
      tbarpos:"first", 
      //type: OpenLayers.Control.TYPE_TOGGLE, 
      formId: 'printpanel',
      exclusiveGroup: 'sidebar',
      iconclass:"glyphicon-white glyphicon-print", 
      title:"Pannello di stampa",
      maxScale:maxScale,
      allowDrag: editMode,
      allowResize: editMode,
      allowRotation: $('input[name="opt_rotation"]').is(':checked'),
      autoCenter: $('[name="opt_center"]').is(':checked'),
      styleBox: styleBox,
      serviceUrl:'/gisclient/services/print.php',
      eventListeners: {
          updateboxInfo: function(e){
              var bounds = this.printBox.geometry.getBounds();
              var center = bounds.getCenterLonLat().clone().transform(proj_3857, proj_3003);
              $('#'+this.formId+' input[name="scale"]').val(Math.round(this.boxScale));
              $('#'+this.formId+' input[name="coordx"]').val(Math.round(center.lon));
              $('#'+this.formId+' input[name="coordy"]').val(Math.round(center.lat));
              $('#'+this.formId+' input[name="boxw"]').val(Math.round(bounds.getWidth()));
              $('#'+this.formId+' input[name="boxh"]').val(Math.round(bounds.getHeight()));
              $('#'+this.formId+' input[name="boxr"]').val(Math.round(this.modifyControl.rotation));
              console.log(this)
          }

      }

    });
    
/*            format: $('#'+this.formId+' input[name="format"]:checked').val(),
            printFormat: $('#'+this.formId+' select[name="formato"]').val(),
            direction: $('#'+this.formId+' input[name="direction"]:checked').val(),*/


    $('#'+this.formId+' select[name="page_layout"]').change(function() {
        btnPrint.pageLayout = $(this).val();
        btnPrint.updatePrintBox();
    });
    $('#'+this.formId+' select[name="page_format"]').change(function() {
        btnPrint.pageFormat = $(this).val();
        btnPrint.updatePrintBox();
    });
    $('#'+this.formId+' select[name="page_legend"]').change(function() {
        btnPrint.pageLegend = $(this).val();
    });
    $('#printpanel').on('click', 'button[role="print"]', function(event) {
        event.preventDefault();
        btnPrint.doPrint();
    });
    $('#'+this.formId+' input[name="opt_rotation"]').change(function() {
        btnPrint.allowRotation = $('input[name="opt_rotation"]').is(':checked');
        btnPrint.updateMode();
    });
    $('#'+this.formId+' input[name="opt_center"]').change(function() {
        btnPrint.autoCenter = $('input[name="opt_center"]').is(':checked');
    });


    $('#'+this.formId+' input[name="scale"]').spinner({
      step: 100,
      min: 100,
      max: maxScale,
      numberFormat: "n",
      change: function( event, ui ) {
        btnPrint.boxScale = $(this).val();
        btnPrint.updatePrintBox();
      },
      spin: function( event, ui ) {
        btnPrint.boxScale = $(this).val();
        btnPrint.updatePrintBox();
      }
    });

    $('#center-button').on('click',function(){
        var x = Math.round(parseFloat($('input[name="coordx"]').attr('value')));
        var y = Math.round(parseFloat($('input[name="coordy"]').attr('value')));
        if(x && y) {
          var position = new OpenLayers.LonLat(x,y).transform(proj_3003,proj_3857);
          btnPrint.movePrintBox(position);
          map.zoomToExtent(btnPrint.getBounds(),true);
          //map.setCenter(position,22,false,false);
        }
    })

    if($('#'+this.formId+' [name="page_layout"]').length)
      btnPrint.pageLayout = $('#'+this.formId+' [name="page_layout"]').attr('value');
    if($('#'+this.formId+' [name="page_format"]').length)
      btnPrint.pageFormat = $('#'+this.formId+' [name="page_format"]').attr('value');
    if($('#'+this.formId+' [name="page_legend"]').length)
      btnPrint.pageLegend = $('#'+this.formId+' [name="page_legend"]:checked').attr('value')=='yes';

    //ricarico i dati salvati
    var x = Math.round(parseFloat($('#'+this.formId+' [name="coordx"]').attr('value')));
    var y = Math.round(parseFloat($('#'+this.formId+' [name="coordy"]').attr('value')));
    if($('#'+this.formId+' [name="scale"]').length>0)
      btnPrint.boxScale = Math.round(parseFloat($('#'+this.formId+' [name="scale"]').attr('value')));


    map.addControl(btnPrint);
    btnPrint.activate();
    if(x && y){
      btnPrint.movePrintBox(new OpenLayers.LonLat(x,y).transform(proj_3003, proj_3857));
      map.zoomToExtent(btnPrint.getBounds(),true);
    } 

    //VISUALIZZAZIONE DELLE COORDINATE
    var projection = this.mapOptions.displayProjection || this.mapOptions.projection;
    projection = new OpenLayers.Projection(projection);
    // var v = projection.getCode().split(":");
    // map.addControl(new OpenLayers.Control.MousePosition({
    //     element:document.getElementById("map-coordinates"),
    //     prefix: '<a target="_blank" ' + 'href="http://spatialreference.org/ref/epsg/' + v[1] + '/">' + projection + '</a> coordinate: '
    // }));

    map.addControl(new OpenLayers.Control.LayerSwitcher())


/*    if(editMode){

      map.events.register("moveend", map, function(){
        if($('[name="opt_center"]').is(':checked')){
          var center = map.getCenter();
          btnPrint.movePrintBox(center);
          center = center.transform(new OpenLayers.Projection("EPSG:3857"),new OpenLayers.Projection("EPSG:3003"));
          $('input[name="coordx"]').val(Math.round(center.lon));
          $('input[name="coordy"]').val(Math.round(center.lat));
        } 
      });

      var bounds = btnPrint.printBox.geometry.getBounds();
      var center = bounds.getCenterLonLat().clone().transform(new OpenLayers.Projection("EPSG:3857"),new OpenLayers.Projection("EPSG:3003"))
      $('input[name="coordx"]').val(Math.round(center.lon));
      $('input[name="coordy"]').val(Math.round(center.lat));
      $('input[name="boxw"]').val(Math.round(bounds.getWidth()));
      $('input[name="boxh"]').val(Math.round(bounds.getHeight()));
    }*/


}//END initMap

    initDialog();
    var GisClientBaseUrl = "/gisclient/"
    OpenLayers.ImgPath = GisClientBaseUrl + "maps/resources/themes/openlayers/img/";

    $.ajax({
      url: GisClientBaseUrl + 'services/gcmap.php',
      dataType: "jsonp",
      data:{"mapset":"test"},
      jsonpCallback: "jsoncallback",
      async: false,
      success: function( response ) {
        //TODO gestire errori da server
        console.log(response)
        var googleCallback;
        if (response.mapProviders && response.mapProviders.length>0) {
            for (var i = 0, len = response.mapProviders.length; i < len; i++) {
                script = document.createElement('script');
                script.type = "text/javascript";
                script.src = response.mapProviders[i];
                if(response.mapProviders[i].indexOf('google')>0){
                    script.src += "&callback=OpenLayers.GisClient.CallBack";
                    OpenLayers.GisClient.CallBack = createDelegate(initGC,response);
                    googleCallback=true;
                } 
                document.getElementsByTagName('head')[0].appendChild(script);
            }   
        }
        if(!googleCallback) initGC.apply(response);      
      }

    })

  function initGC(){

    //console.log(this)
    //In this c'è l'oggetto response
    Proj4js.defs["EPSG:3857"] = Proj4js.defs["GOOGLE"];
    if(this.projdefs){
      for (key in this.projdefs){
        if(!Proj4js.defs[key]) Proj4js.defs[key] = this.projdefs[key];
      }
    }
    var options = {
      useMapproxy:true,
      mapProxyBaseUrl:"/",
      baseUrl: GisClientBaseUrl,
      mapOptions:{
        controls:[
            new OpenLayers.Control.Navigation({zoomWheelEnabled:true}),
            new OpenLayers.Control.Attribution(),
            new OpenLayers.Control.LoadingPanel(),
            new OpenLayers.Control.PanZoomBar(),
            new OpenLayers.Control.ScaleLine()
            
            /*
            new OpenLayers.Control.TouchNavigation({
                dragPanOptions: {
                    enableKinetic: true
                }
            }),
            //new OpenLayers.Control.PinchZoom(),
*/

        ]
        //scale:2000,
        //center:[8.92811, 44.41320]
      },
      callback:initMap
    };
    OpenLayers.Util.extend(options,this);
    GisClientMap = new OpenLayers.GisClient(null,'map',options)

  }




  function createDelegate(handler, obj)
  {
      obj = obj || this;
      return function() {
          handler.apply(obj, arguments);
      }
  }

});
