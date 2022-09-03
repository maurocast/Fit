// funzione di attesa
// viene visualizzato il div loader con una bicicletta
// dentro il div indicato nel paramtero 
function fnc_wait(divParm)
{
      div = document.createElement("div")
      div.id = "loader"
      img = document.createElement("img")
      img.src = "bike.png"
      div.appendChild(img)
      document.getElementById(divParm).appendChild(div)
}      