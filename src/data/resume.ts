export const resume = {
  name: 'Chan Kang (kentakang)',
  title: 'Software Engineer',
  location: 'Seoul, Korea',
  email: 'me@kentakang.com',
  links: [
    { label: 'GitHub', url: 'https://github.com/kentakang' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/kentakang' },
    { label: 'X', url: 'https://x.com/kentakang_' },
  ],
  summary: [
    "Hello! I'm a software engineer based in Seoul, Korea.",
    'I am interested in frontend development using React and React Native, and backend development using Rust and Kotlin.',
    'Aside from the technical skills, I am very interested in the means of protecting privacy through cryptography and enjoy reinventing the wheel.',
  ],
  skills: [
    'Frontend development: React, React Native',
    'Backend development: Rust, Kotlin',
    'Privacy, cryptography, and open source software',
  ],
  experiences: [
    {
      period: '2025. 07 - present',
      role: 'Co-Founder',
      organization: 'Repixel Co, Ltd.',
      url: 'https://repixel.co.kr',
    },
    {
      period: '2021. 02 - 2025.07',
      role: 'Co-Founder and Chief Technology Officer',
      organization: 'Investy Co, Ltd.',
      url: 'https://boundary.team',
    },
    {
      period: '2020. 01 - 2021. 02',
      role: 'Development Team Leader',
      organization: 'DKBrothers.',
    },
    {
      period: '2018. 12 - 2020. 01',
      role: 'Backend Developer',
      organization: 'DKBrothers.',
    },
    {
      period: '2017. 03 - 2020. 02',
      role: 'Studied Computer Network',
      organization: 'Hanyang Technical High School',
      url: 'https://hanyang.sen.hs.kr/',
      suffix: '.',
    },
  ],
  projects: [
    {
      name: 'hyper-pwt',
      url: 'https://github.com/repixelcorp/hyper-pwt',
      description: 'A faster, more modern, superior alternative for Mendix PWT.',
      role: 'Project Founder and Maintainer',
    },
    {
      name: 'prisma-schema-import',
      url: 'https://github.com/investycorp/prisma-schema-import',
      description: 'CLI Tool for importing Prisma schema.',
      role: 'Project Founder and Maintainer',
    },
    {
      name: 'oss-license-check',
      url: 'https://github.com/kentakang/oss-license-check',
      description: 'CLI Tool for checking OSS licenses.',
      role: 'Project Founder and Maintainer',
    },
  ],
  contributions: [
    {
      name: '@react-native-community/cli',
      url: 'https://github.com/react-native-community/cli',
      pulls: [
        {
          title: '#1785 fix: when used with option --port and --deviceId not working on run-android',
          url: 'https://github.com/react-native-community/cli/pull/1785',
        },
      ],
    },
    {
      name: 'DefinitelyTyped/DefinitelyTyped',
      url: 'https://github.com/DefinitelyTyped/DefinitelyTyped',
      pulls: [
        {
          title: '#52398 create @types/aws-lambda-fastify',
          url: 'https://github.com/DefinitelyTyped/DefinitelyTyped/pull/52398',
        },
      ],
    },
    {
      name: 'endel/NativeWebSocket',
      url: 'https://github.com/endel/NativeWebSocket',
      pulls: [
        {
          title: '#54 Fix issues on Unity 2021.2',
          url: 'https://github.com/endel/NativeWebSocket/pull/54',
        },
      ],
    },
    {
      name: 'peacechen/react-native-modal-selector',
      url: 'https://github.com/peacechen/react-native-modal-selector',
      pulls: [
        {
          title: '#106 Add initValueTextStyle prop',
          url: 'https://github.com/peacechen/react-native-modal-selector/pull/106',
        },
      ],
    },
    {
      name: 'crossplatformkorea/react-native-naver-login',
      url: 'https://github.com/crossplatformkorea/react-native-naver-login',
      pulls: [
        {
          title: '#121 Naver login android sdk upgrade 5.1.0',
          url: 'https://github.com/crossplatformkorea/react-native-naver-login/pull/121',
        },
      ],
    },
    {
      name: 'Kai-Z-JP/KaizPatchX',
      url: 'https://github.com/Kai-Z-JP/KaizPatchX',
      pulls: [
        {
          title: '#442 Add texture name on railroad sign gui',
          url: 'https://github.com/Kai-Z-JP/KaizPatchX/pull/442',
        },
      ],
    },
  ],
} as const;
