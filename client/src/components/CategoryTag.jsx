export default function CategoryTag({ category }) {
  if (!category) return null
  return (
    <span className="cat" data-cat={category}>
      {category}
    </span>
  )
}
