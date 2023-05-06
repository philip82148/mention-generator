export function showBanner(text) {
  if ($(".banner").length) $(".banner").remove();

  const $banner = $(`<div class="banner"></div>`);
  $banner.text(text);
  $("body").append($banner);
  setTimeout(function () {
    $banner.fadeOut("normal", function () {
      $banner.remove();
    });
  }, 3000);
}
