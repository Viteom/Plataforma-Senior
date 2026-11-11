// Aplica la letra grande y el contraste que la persona guardó, antes de pintar la página.
// Ver components/layout/accesibilidad.tsx.
try {
  var a = JSON.parse(localStorage.getItem("kanna-accesibilidad") || "{}");
  var d = document.documentElement.dataset;
  if (a.letra === "grande" || a.letra === "muy-grande") d.letra = a.letra;
  if (a.contraste === true) d.contraste = "alto";
  if (a.enlaces === true) d.enlaces = "subrayados";
} catch (e) {}
