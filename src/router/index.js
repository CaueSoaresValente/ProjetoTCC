import { createRouter, createWebHistory } from "vue-router";

import Login from "@/pages/login/login";
import TelaInput from "@/pages/login/TelaInput.vue";
import Findprofessor from "@/pages/gestaoProfessores/Findprofessor.vue";
import Turmas from "@/pages/turmas/turmas.vue";
import addTurmas from "@/pages/turmas/addTurmas.vue";
import GerAreasComp from "@/pages/Areas_Competencias/GerAreasComp.vue";
import PerfilProfessor from "@/pages/professor/PerfilProfessor.vue";
import DisponibilidadeProf from "@/pages/professor/DisponibilidadeProf.vue";
import CalendarioProf from "@/pages/professor/CalendarioProf.vue";
import GerenciarCadastros from "@/pages/gestaoProfessores/GerenciarCadastros.vue";
import VisualizarProfessores from "@/pages/gestaoProfessores/VisualizarProfessores.vue";
import MeuPerfil from "@/pages/perfil/MeuPerfil.vue";


const routes = [

  {
    path: "/",
    name: "telainput",
    component: TelaInput,
  },

  {
    path: "/login",
    name: "login",
    component: Login,
  },
  {
     path: "/findprofessor",
     name: "findprofessor",
     component: Findprofessor,
  },
 {
     path: "/turmas",
     name: "turmas",
     component: Turmas,
  },
  {
     path: "/addturmas",
     name: "addturmas",
     component: addTurmas,
  },
  {
    path: "/GerAreasComp",
    name: "GerAreasComp",
    component: GerAreasComp,
 },
 {
  path:"/perfilprofessor",
  name:"perfilprofessor",
  component: PerfilProfessor,
 },
 {
  path:"/disponibilidadeprof",
  name:"disponibilidadeprof",
  component: DisponibilidadeProf,
 },
  {
  path:"/calendarioprof",
  name:"calendarioprof",
  component: CalendarioProf,
 },
 {
  path: "/gerenciarcadastros",
  name: "GerenciarCadastros",
  component: GerenciarCadastros,
 },
 {
  path: "/visualizarprofessores",
  name: "visualizarprofessores",
  component: VisualizarProfessores,
 },
 {
  path: "/perfil",
  name: "meuperfil",
  component: MeuPerfil,
 },

];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;