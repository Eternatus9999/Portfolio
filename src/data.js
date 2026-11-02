// ✏️ Edit everything about you here.
export const me = {
  name: 'Chathusha Pehemina Alagiyawanna',
  short: 'Chathusha',
  tagline: 'Developer building things that feel alive.',
  github: 'https://github.com/Eternatus9999',
  linkedin: 'https://www.linkedin.com/in/chathusha-alagiyawanna-847980312/',
}

// pos = [x, z] in the 3D world. colors = [glass tint, glow].
export const sections = [
  {
    id: 'about', title: 'About me', shape: 'icosa', pos: [-18, -10], colors: ['#7c5cff', '#22d3ee'],
    body: 'Hi, I’m Chathusha Pehemina.An aspiring Full Stack Developer and Game Developer. I love building things that feel alive. I’m currently learning more about 3D development and game development.',
    image: '/images/Profile.png',
  },
  {
    id: 'skills', title: 'Skills', shape: 'octa', pos: [18, -10], colors: ['#22d3ee', '#34d399'],
    body: 'Technologies I work with.',
    chips: ['JavaScript', 'React', 'Three.js', 'Tailwind CSS', 'Java', 'JavaFX', 'HTML', 'CSS', 'Node.js', 'Express.js', 'MongoDB', 'MySQL', 'Python', 'C++', 'C', 'C#', 'PHP', 'Bootstrap', 'Angular'],
  },
  {
    id: 'projects', title: 'Projects', shape: 'knot', pos: [-18, 16], colors: ['#ff5caa', '#7c5cff'],
    body: 'Things I’ve built. More on my GitHub.',
    items: [
      { title: '3D Picture Book', text: 'Simple Book animation using Three.js', img: '/images/3dBook.png', href: 'https://github.com/Eternatus9999/BookAnimationwithReact.git' },
      { title: 'BQ Burgers', text: 'Simple Html, CSS and JavaScript project', img: '/images/BQburgers.png', href: 'https://github.com/Eternatus9999/BQBurgers.git' },
      { title: 'Weather Forecast', text: 'simple weather app', img: '/images/Weather.png', href: 'https://github.com/Eternatus9999/Weather-App.git' },
      { title: 'Colour Blinder', text: 'Simple game made using JavaFX', img: '/images/projectcolourblinder.png', href: 'https://github.com/vindikaters-coders/Project_Colour_Blinder.git' },
      { title: 'SortLab', text: 'DSA Sorting Game', img: '/images/SortLab.png', href: 'https://github.com/Eternatus9999/SortLab.git' },
      { title: 'ExploreSriLanka', text: 'website for exploring Sri Lanka', img: '/images/Explore.png', href: 'https://github.com/Eternatus9999/' },
    ],
  },
  {
    id: 'contact', title: 'Contact', shape: 'dodeca', pos: [18, 16], colors: ['#f59e0b', '#ff5caa'],
    body: 'Want to work together or just say hi? Find me here.',
    links: [
      { label: 'GitHub', href: me.github },
      { label: 'LinkedIn', href: me.linkedin },
    ],
  },
]
