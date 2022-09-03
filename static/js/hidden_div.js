// riceve tre array con i nomi dei div:
// la prima array contiene gli elementi da nascondere
// la seconda quelli da visualizzare block
// la terza quelli da visualizzare flex
function hidden_div(div_hidden, div_disply, div_disply_flex) {
  div_hidden.forEach(function (element_div) {
    document.getElementById(element_div).style.display = "none";
  });
  div_disply.forEach(function (element_div) {
    document.getElementById(element_div).style.display = "block";
  });
  div_disply_flex.forEach(function (element_div) {
    document.getElementById(element_div).style.display = "flex";
  });
}