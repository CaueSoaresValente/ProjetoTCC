import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAllTables1774032701430 implements MigrationInterface {
    name = 'CreateAllTables1774032701430'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`professor_turma\` (\`id_professorturma\` int NOT NULL AUTO_INCREMENT, \`id_turma\` int NOT NULL, \`id_professor\` int NOT NULL, \`status\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_502071be435fe7793d37804497\` (\`id_turma\`), UNIQUE INDEX \`IDX_22b521f7c2a311c1a21a92ebaf\` (\`id_professor\`), UNIQUE INDEX \`IDX_f2d97c13c9a0b4f2b4e8eea10c\` (\`id_turma\`, \`id_professor\`), PRIMARY KEY (\`id_professorturma\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`turma\` (\`id_turma\` int NOT NULL AUTO_INCREMENT, \`nome\` varchar(255) NOT NULL, \`id_gestor\` int NOT NULL, \`id_opp\` int NOT NULL, \`id_disciplina\` int NOT NULL, \`data_inicio\` date NOT NULL, \`data_termino\` date NOT NULL, \`periodo\` varchar(255) NOT NULL, \`status\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`id_turma\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`disciplina\` (\`id_disciplina\` int NOT NULL AUTO_INCREMENT, \`nome\` varchar(255) NOT NULL, \`status\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`id_disciplina\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`professor_disciplina\` (\`id_professordisciplina\` int NOT NULL AUTO_INCREMENT, \`id_disciplina\` int NOT NULL, \`id_professor\` int NOT NULL, \`nivelCompetencia\` decimal(5,2) NOT NULL, \`status\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_3373ae567393b279258c79cda5\` (\`id_disciplina\`), UNIQUE INDEX \`IDX_0dc30d59937ddb478011b94e44\` (\`id_professor\`), UNIQUE INDEX \`IDX_25ae8e03dd4d1ac42a30718d64\` (\`id_disciplina\`, \`id_professor\`), PRIMARY KEY (\`id_professordisciplina\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`disponibilidade\` (\`id_disponibilidade\` int NOT NULL AUTO_INCREMENT, \`dia\` date NOT NULL, \`periodo\` varchar(255) NOT NULL, \`id_professor\` int NOT NULL, \`status\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`id_disponibilidade\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`professor\` (\`id_professor\` int NOT NULL AUTO_INCREMENT, \`id_opp\` int NOT NULL, \`id_cadastro\` int NOT NULL, \`status\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`id_professor\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`opp\` (\`id_opp\` int NOT NULL AUTO_INCREMENT, \`id_cadastro\` int NOT NULL, \`id_gestor\` int NOT NULL, \`status\` tinyint NOT NULL DEFAULT 1, \`setor\` varchar(255) NOT NULL, PRIMARY KEY (\`id_opp\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`gestor\` (\`id_gestor\` int NOT NULL AUTO_INCREMENT, \`status\` tinyint NOT NULL DEFAULT 1, \`id_cadastro\` int NOT NULL, \`setor\` varchar(255) NOT NULL, PRIMARY KEY (\`id_gestor\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`cadastro\` (\`id_usuario\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`senha\` varchar(255) NOT NULL, \`função\` varchar(255) NOT NULL, \`nome\` varchar(255) NOT NULL, \`status\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_d5a601e8efc162d4e26b623bfb\` (\`email\`), PRIMARY KEY (\`id_usuario\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`professor_turma\` ADD CONSTRAINT \`FK_502071be435fe7793d37804497d\` FOREIGN KEY (\`id_turma\`) REFERENCES \`turma\`(\`id_turma\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`professor_turma\` ADD CONSTRAINT \`FK_22b521f7c2a311c1a21a92ebaf1\` FOREIGN KEY (\`id_professor\`) REFERENCES \`professor\`(\`id_professor\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`turma\` ADD CONSTRAINT \`FK_46b40ee215112e79da26356292f\` FOREIGN KEY (\`id_gestor\`) REFERENCES \`gestor\`(\`id_gestor\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`turma\` ADD CONSTRAINT \`FK_4bd9332a2c374d3ea6752a0b757\` FOREIGN KEY (\`id_opp\`) REFERENCES \`opp\`(\`id_opp\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`turma\` ADD CONSTRAINT \`FK_bfbf357b9f3f4bed97c09c597a3\` FOREIGN KEY (\`id_disciplina\`) REFERENCES \`disciplina\`(\`id_disciplina\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`professor_disciplina\` ADD CONSTRAINT \`FK_3373ae567393b279258c79cda58\` FOREIGN KEY (\`id_disciplina\`) REFERENCES \`disciplina\`(\`id_disciplina\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`professor_disciplina\` ADD CONSTRAINT \`FK_0dc30d59937ddb478011b94e44d\` FOREIGN KEY (\`id_professor\`) REFERENCES \`professor\`(\`id_professor\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`disponibilidade\` ADD CONSTRAINT \`FK_658ea81e9f650613f285ff146ad\` FOREIGN KEY (\`id_professor\`) REFERENCES \`professor\`(\`id_professor\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`professor\` ADD CONSTRAINT \`FK_0c84a35b6e017a281d8130f3e76\` FOREIGN KEY (\`id_opp\`) REFERENCES \`opp\`(\`id_opp\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`professor\` ADD CONSTRAINT \`FK_614f7125985769e914e84b6defa\` FOREIGN KEY (\`id_cadastro\`) REFERENCES \`cadastro\`(\`id_usuario\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`opp\` ADD CONSTRAINT \`FK_00461f0c35908d71c36f31e3a6e\` FOREIGN KEY (\`id_cadastro\`) REFERENCES \`cadastro\`(\`id_usuario\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`opp\` ADD CONSTRAINT \`FK_0bc481212c06de4878c821a3cb6\` FOREIGN KEY (\`id_gestor\`) REFERENCES \`gestor\`(\`id_gestor\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`gestor\` ADD CONSTRAINT \`FK_bad360d14baddbd83e497d18a40\` FOREIGN KEY (\`id_cadastro\`) REFERENCES \`cadastro\`(\`id_usuario\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`gestor\` DROP FOREIGN KEY \`FK_bad360d14baddbd83e497d18a40\``);
        await queryRunner.query(`ALTER TABLE \`opp\` DROP FOREIGN KEY \`FK_0bc481212c06de4878c821a3cb6\``);
        await queryRunner.query(`ALTER TABLE \`opp\` DROP FOREIGN KEY \`FK_00461f0c35908d71c36f31e3a6e\``);
        await queryRunner.query(`ALTER TABLE \`professor\` DROP FOREIGN KEY \`FK_614f7125985769e914e84b6defa\``);
        await queryRunner.query(`ALTER TABLE \`professor\` DROP FOREIGN KEY \`FK_0c84a35b6e017a281d8130f3e76\``);
        await queryRunner.query(`ALTER TABLE \`disponibilidade\` DROP FOREIGN KEY \`FK_658ea81e9f650613f285ff146ad\``);
        await queryRunner.query(`ALTER TABLE \`professor_disciplina\` DROP FOREIGN KEY \`FK_0dc30d59937ddb478011b94e44d\``);
        await queryRunner.query(`ALTER TABLE \`professor_disciplina\` DROP FOREIGN KEY \`FK_3373ae567393b279258c79cda58\``);
        await queryRunner.query(`ALTER TABLE \`turma\` DROP FOREIGN KEY \`FK_bfbf357b9f3f4bed97c09c597a3\``);
        await queryRunner.query(`ALTER TABLE \`turma\` DROP FOREIGN KEY \`FK_4bd9332a2c374d3ea6752a0b757\``);
        await queryRunner.query(`ALTER TABLE \`turma\` DROP FOREIGN KEY \`FK_46b40ee215112e79da26356292f\``);
        await queryRunner.query(`ALTER TABLE \`professor_turma\` DROP FOREIGN KEY \`FK_22b521f7c2a311c1a21a92ebaf1\``);
        await queryRunner.query(`ALTER TABLE \`professor_turma\` DROP FOREIGN KEY \`FK_502071be435fe7793d37804497d\``);
        await queryRunner.query(`DROP INDEX \`IDX_d5a601e8efc162d4e26b623bfb\` ON \`cadastro\``);
        await queryRunner.query(`DROP TABLE \`cadastro\``);
        await queryRunner.query(`DROP TABLE \`gestor\``);
        await queryRunner.query(`DROP TABLE \`opp\``);
        await queryRunner.query(`DROP TABLE \`professor\``);
        await queryRunner.query(`DROP TABLE \`disponibilidade\``);
        await queryRunner.query(`DROP INDEX \`IDX_25ae8e03dd4d1ac42a30718d64\` ON \`professor_disciplina\``);
        await queryRunner.query(`DROP INDEX \`IDX_0dc30d59937ddb478011b94e44\` ON \`professor_disciplina\``);
        await queryRunner.query(`DROP INDEX \`IDX_3373ae567393b279258c79cda5\` ON \`professor_disciplina\``);
        await queryRunner.query(`DROP TABLE \`professor_disciplina\``);
        await queryRunner.query(`DROP TABLE \`disciplina\``);
        await queryRunner.query(`DROP TABLE \`turma\``);
        await queryRunner.query(`DROP INDEX \`IDX_f2d97c13c9a0b4f2b4e8eea10c\` ON \`professor_turma\``);
        await queryRunner.query(`DROP INDEX \`IDX_22b521f7c2a311c1a21a92ebaf\` ON \`professor_turma\``);
        await queryRunner.query(`DROP INDEX \`IDX_502071be435fe7793d37804497\` ON \`professor_turma\``);
        await queryRunner.query(`DROP TABLE \`professor_turma\``);
    }

}
