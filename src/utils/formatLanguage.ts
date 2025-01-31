const formatLanguage = (language: string) => {
  if (language === 'korean') {
    return '🇰🇷';
  }

  return '🇺🇸';
};

export default formatLanguage;