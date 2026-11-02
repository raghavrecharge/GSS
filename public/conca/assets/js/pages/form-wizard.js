( function ( $ ) {
    'use strict';
  
    $(function() {
        let wz_class = ".wizard";
        
        const args = {
          "wz_class": ".wizard",
          "wz_nav_style": "dots",
          "wz_button_style": ".btn .btn-sm .mx-1",
          "wz_ori": "horizontal", // vertical
          "buttons": true,
          "navigation": "all",
          "finish": "Finish",
          "bubble": true,
          validate: true,
        };
        
        const wizard = new Wizard(args);
        wizard.init();
        
        let $wz_doc = document.querySelector(wz_class);
        
        $wz_doc.addEventListener("wz.form.submit", function (e) {
          alert("Form Submitted");
        });
         
    });
  
  }(jQuery) )