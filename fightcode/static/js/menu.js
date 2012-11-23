(function(){

  var menuContainer = $('.menu-container');
  var topBorder = $('.ribbon-container');
  var ribbon = menuContainer.find('.ribbon');

  ribbon.on('click', function(){
    menuContainer.toggleClass('open');
  });

  ribbon.on('hover', function(){
    topBorder.trigger('hover');
  });

})();