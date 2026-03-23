export interface Campaign {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  imageUrl: string;
  targetAmount: number;
  collectedAmount: number;
  isCompleted: boolean;
  category: string;
  createdAt: string;
  donations: Donation[];
}

export interface Donation {
  id: string;
  donorName: string;
  amount: number;
  date: string;
  message?: string;
}

export const campaigns: Campaign[] = [
  {
    id: "1",
    title: "Ремонт на детска площадка в кв. Зелин",
    shortDescription: "Набиране на средства за обновяване на детската площадка в квартал Зелин, Ботевград.",
    fullDescription: "Детската площадка в кв. Зелин се нуждае от спешен ремонт. Съоръженията са амортизирани и представляват опасност за децата. С вашата помощ ще монтираме нови люлки, пързалки и ударопоглъщаща настилка. Проектът включва и озеленяване на прилежащата зона.",
    imageUrl: "",
    targetAmount: 15000,
    collectedAmount: 8750,
    isCompleted: false,
    category: "Инфраструктура",
    createdAt: "2025-01-15",
    donations: [
      { id: "d1", donorName: "Иван П.", amount: 100, date: "2025-03-20", message: "За децата!" },
      { id: "d2", donorName: "Мария К.", amount: 250, date: "2025-03-19" },
      { id: "d3", donorName: "Анонимен", amount: 50, date: "2025-03-18", message: "Успех!" },
      { id: "d4", donorName: "Петър Д.", amount: 500, date: "2025-03-17" },
    ],
  },
  {
    id: "2",
    title: "Подкрепа за читалище \"Просвета\"",
    shortDescription: "Помогнете за закупуване на нови книги и оборудване за читалище 'Просвета'.",
    fullDescription: "Читалище 'Просвета' е сърцето на културния живот в Ботевград. Нуждаем се от средства за закупуване на нови книги, компютърно оборудване и ремонт на залата за мероприятия. Вашата подкрепа ще помогне на стотици деца и възрастни да имат достъп до знание и култура.",
    imageUrl: "",
    targetAmount: 10000,
    collectedAmount: 3200,
    isCompleted: false,
    category: "Култура",
    createdAt: "2025-02-01",
    donations: [
      { id: "d5", donorName: "Елена С.", amount: 200, date: "2025-03-21", message: "За културата!" },
      { id: "d6", donorName: "Георги М.", amount: 150, date: "2025-03-20" },
    ],
  },
  {
    id: "3",
    title: "Залесяване на Зелин баир",
    shortDescription: "Инициатива за засаждане на 500 нови дръвчета в района на Зелин баир.",
    fullDescription: "Зелин баир е емблематично място за жителите на Ботевград. С тази кампания планираме засаждане на 500 нови дръвчета — дъбове, букове и борове. Средствата ще покрият закупуването на фиданки, транспорт и организиране на доброволчески събития.",
    imageUrl: "",
    targetAmount: 5000,
    collectedAmount: 4800,
    isCompleted: false,
    category: "Екология",
    createdAt: "2025-01-20",
    donations: [
      { id: "d7", donorName: "Фирма ЕкоБот", amount: 2000, date: "2025-03-15" },
      { id: "d8", donorName: "Анонимен", amount: 300, date: "2025-03-14", message: "Да запазим природата!" },
    ],
  },
  {
    id: "4",
    title: "Стипендии за талантливи ученици",
    shortDescription: "Подкрепете образованието — дарете за стипендии на изявени ученици от Ботевград.",
    fullDescription: "Много талантливи ученици от Ботевград имат нужда от финансова подкрепа, за да продължат образованието си. Тази кампания събира средства за стипендии, които ще покрият учебни материали, курсове и участия в олимпиади.",
    imageUrl: "",
    targetAmount: 8000,
    collectedAmount: 8000,
    isCompleted: true,
    category: "Образование",
    createdAt: "2024-09-01",
    donations: [
      { id: "d9", donorName: "Ботевград АД", amount: 3000, date: "2024-12-01" },
      { id: "d10", donorName: "Родителски комитет", amount: 2500, date: "2024-11-20" },
    ],
  },
  {
    id: "5",
    title: "Ремонт на покрива на храм \"Св. Богородица\"",
    shortDescription: "Набиране на средства за спешен ремонт на покрива на храма.",
    fullDescription: "Храм 'Св. Богородица' е архитектурна и духовна ценност за Ботевград. Покривът се нуждае от спешен ремонт поради течове. Средствата ще бъдат използвани за подмяна на керемидите и укрепване на дървената конструкция.",
    imageUrl: "",
    targetAmount: 20000,
    collectedAmount: 20000,
    isCompleted: true,
    category: "Наследство",
    createdAt: "2024-06-15",
    donations: [
      { id: "d11", donorName: "Анонимен", amount: 5000, date: "2024-10-01" },
      { id: "d12", donorName: "Община Ботевград", amount: 10000, date: "2024-09-15" },
    ],
  },
  {
    id: "6",
    title: "Спортна екипировка за ФК Балкан",
    shortDescription: "Помогнете на младите футболисти с нова спортна екипировка и топки.",
    fullDescription: "Младежкият отбор на ФК Балкан Ботевград се нуждае от нова екипировка за предстоящия сезон. Средствата ще покрият нови екипи, топки, конуси и друго спортно оборудване за тренировки и мачове.",
    imageUrl: "",
    targetAmount: 3000,
    collectedAmount: 1200,
    isCompleted: false,
    category: "Спорт",
    createdAt: "2025-03-01",
    donations: [
      { id: "d13", donorName: "Спортен магазин БГ", amount: 500, date: "2025-03-22" },
      { id: "d14", donorName: "Димитър Н.", amount: 100, date: "2025-03-21" },
    ],
  },
];

export const getActiveCampaigns = () => campaigns.filter((c) => !c.isCompleted);
export const getCompletedCampaigns = () => campaigns.filter((c) => c.isCompleted);
export const getCampaignById = (id: string) => campaigns.find((c) => c.id === id);
export const getFeaturedCampaigns = () => campaigns.filter((c) => !c.isCompleted).slice(0, 3);
