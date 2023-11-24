export const getMinMaxCoordinate = (
  x: number,
  y: number,
  distance_threshold: number,
) => {
  return [
    x - distance_threshold,
    x + distance_threshold,
    y - distance_threshold,
    y + distance_threshold,
  ];
};
