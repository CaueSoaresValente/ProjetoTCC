declare namespace Express {
  export interface Request {
    usuario?: {
      idUsuario: number;
      email: string;
      funcao: string;
      nome: string;
    };
  }
}
