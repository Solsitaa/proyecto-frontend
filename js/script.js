let reconocimiento = document.querySelectorAll('.reputacion');

for(let i = 0; i < reconocimiento.length; i ++){
    reconocimiento[i].addEventListener("click", function(){
        alert("Has dado un reconocimiento");
    });
}

var botonCambiar = document.getElementById("init");

botonCambiar.addEventListener("click", function() {
    this.innerText = "Cerrar Sesion";
});