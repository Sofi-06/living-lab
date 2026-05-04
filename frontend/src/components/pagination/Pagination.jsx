import './Pagination.css'

function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'registros',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = totalItems === 0 ? 0 : Math.min(totalItems, currentPage * pageSize)

  if (totalItems <= pageSize) {
    return null
  }

  return (
    <div className="pagination" aria-label={`Paginacion de ${itemLabel}`}>
      <span className="pagination-summary">
        Mostrando {startItem}-{endItem} de {totalItems} {itemLabel}
      </span>

      <div className="pagination-actions">
        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Anterior
        </button>

        <span className="pagination-page">
          Pagina {currentPage} de {totalPages}
        </span>

        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}

export default Pagination
