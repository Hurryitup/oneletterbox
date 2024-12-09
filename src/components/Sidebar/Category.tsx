interface CategoryProps {
  title: string;
}

export const Category = ({ title }: CategoryProps) => (
  <div className="category">{title}</div>
);