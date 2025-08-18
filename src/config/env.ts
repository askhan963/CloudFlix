import 'dotenv/config';

const required = (key: string) => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),

  mysql: {
    host: required('MYSQL_HOST'),
    port: Number(process.env.MYSQL_PORT || 3306),
    user: required('MYSQL_USER'),
    pass: required('MYSQL_PASSWORD'),
    db: required('MYSQL_DB'),
    ssl: (process.env.MYSQL_SSL || 'true').toLowerCase() === 'true',
    caPath: process.env.MYSQL_SSL_CA
  },

  blob: {
    connStr: required('AZURE_STORAGE_CONNECTION_STRING'),
    container: process.env.BLOB_CONTAINER || 'videos'
  }
} as const;
