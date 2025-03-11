import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

// Cargamos las variables de entorno.
dotenv.config();

// Obtenemos las variables de entorno necesarias.
const {
    MYSQL_HOST,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE,
    MYSQL_ADMIN,
    MYSQL_ADMIN_PASSWORD,
    MYSQL_ADMIN_EMAIL,
    DB_SSL,
    CA_CERT,
} = process.env;

// Variable que almacenará un grupo de conexiones con la base de datos.
let pool;

// Configuración del administrador.
const adminConfig = {
    user: MYSQL_ADMIN,
    password: MYSQL_ADMIN_PASSWORD,
    email: MYSQL_ADMIN_EMAIL || 'admin@default.com', // Valor por defecto si está vacío
};

// Función que retorna las conexiones.
const getPool = async () => {
    try {
        // Si no existen conexiones las creamos.
        if (!pool) {
            // Configurar SSL si es necesario.
            const sslOptions =
                DB_SSL === 'true' && CA_CERT
                    ? {
                          ca: fs.readFileSync(CA_CERT), // Leer el archivo CA.pem
                          rejectUnauthorized: false, // Acepta certificados autofirmados
                      }
                    : undefined;

            // Creamos una única conexión con el servidor MySQL.
            const dbConnection = await mysql.createConnection({
                host: MYSQL_HOST,
                user: MYSQL_USER,
                password: MYSQL_PASSWORD,
                port: 24180,
                ssl: sslOptions, // Usar el certificado SSL si está habilitado
                connectTimeout: 10000,
            });

            // Con dicha conexión vamos a crear la base de datos si no existe.
            await dbConnection.query(
                `CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE}`,
            );

            // Tras asegurarnos de que existe la base de datos creamos el pool.
            pool = mysql.createPool({
                host: MYSQL_HOST,
                user: MYSQL_USER,
                password: MYSQL_PASSWORD,
                database: MYSQL_DATABASE,
                timezone: 'Z',
                ssl: sslOptions, // También usar el certificado SSL en el pool
                connectTimeout: 10000, // 10 segundos de tiempo de espera para el pool
                acquireTimeout: 10000, // 10 segundos para adquirir una conexión
            });
        }

        // Retornamos el pool.
        return await pool;
    } catch (err) {
        console.error(err);
    }
};

export { getPool, adminConfig };
