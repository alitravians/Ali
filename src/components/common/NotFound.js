import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="not-found">
      <h1>404</h1>
      <h2>{t('notFound.title')}</h2>
      <p>{t('notFound.message')}</p>
      <Link to="/" className="btn btn-primary">
        {t('notFound.backHome')}
      </Link>
    </div>
  );
};

export default NotFound;
