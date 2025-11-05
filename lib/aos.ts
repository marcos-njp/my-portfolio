import AOS from 'aos';

export const initAOS = () => {
  AOS.init({
    duration: 800,
    once: true,
    offset: 100,
    delay: 100,
  });
};