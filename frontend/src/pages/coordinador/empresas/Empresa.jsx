import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeleteIcon, EditIcon } from '../../../components/icons/ActionIcons'
import DashboardNavbar, { COORDINADOR_LINKS } from '../../../components/navbar/DashboardNavbar'
import { deleteCompany, getCompanies } from '../../../services/companies'
import { clearSessionUser } from '../../../utils/session'
import './Empresa.css'

function normalizeText(value) {
	return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function Empresa() {
	const navigate = useNavigate()
	const [companies, setCompanies] = useState([])
	const [searchValue, setSearchValue] = useState('')
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [message, setMessage] = useState('')

	useEffect(() => {
		let cancelled = false

		async function loadCompanies() {
			setLoading(true)
			setError('')

			try {
				const payload = await getCompanies()

				if (!cancelled) {
					setCompanies(payload?.companies ?? [])
				}
			} catch (fetchError) {
				if (!cancelled) {
					setCompanies([])
					setError(fetchError instanceof Error ? fetchError.message : 'No se pudo cargar la lista de empresas')
				}
			} finally {
				if (!cancelled) {
					setLoading(false)
				}
			}
		}

		loadCompanies()

		return () => {
			cancelled = true
		}
	}, [])

	useEffect(() => {
		if (message) {
			const timeout = setTimeout(() => setMessage(''), 3000)
			return () => clearTimeout(timeout)
		}
	}, [message])

	useEffect(() => {
		if (error) {
			const timeout = setTimeout(() => setError(''), 3000)
			return () => clearTimeout(timeout)
		}
	}, [error])

	const filteredCompanies = useMemo(() => {
		const term = normalizeText(searchValue)

		if (!term) return companies

		return companies.filter((company) => {
			const nombre = normalizeText(company.nombre)
			const sector = normalizeText(company.sector)
			const representante = normalizeText(company.representante?.name)
			const email = normalizeText(company.email)
			const telefono = normalizeText(company.telefono)

			return (
				nombre.includes(term) ||
				sector.includes(term) ||
				representante.includes(term) ||
				email.includes(term) ||
				telefono.includes(term)
			)
		})
	}, [searchValue, companies])

	function handleLogout() {
		clearSessionUser()
		navigate('/login', { replace: true })
	}

	function handleEditClick(company) {
		navigate(`/coordinador/empresas/editar-empresa/${company.id}`)
	}

	async function handleDelete(company) {
		const confirmed = globalThis.confirm(`Eliminar empresa ${company.nombre}? Esta accion no se puede deshacer.`)
		if (!confirmed) return

		try {
			await deleteCompany(company.id)
			setCompanies((currentCompanies) => currentCompanies.filter((item) => item.id !== company.id))
			setMessage(`Empresa ${company.nombre} eliminada correctamente.`)
			setError('')
		} catch (deleteError) {
			setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar la empresa')
			setMessage('')
		}
	}

	let tableContent = null

	if (loading) {
		tableContent = <div className="coor-company-empty">Cargando empresas...</div>
	} else if (filteredCompanies.length === 0) {
		tableContent = <div className="coor-company-empty">No se encontraron empresas con ese criterio.</div>
	} else {
		tableContent = (
			<table className="coor-company-table">
				<thead>
					<tr>
						<th>ID</th>
						<th>Nombre</th>
						<th>Sector</th>
						<th>Representante</th>
						<th>Email</th>
						<th>Telefono</th>
						<th>Acciones</th>
					</tr>
				</thead>
				<tbody>
					{filteredCompanies.map((company) => (
						<tr key={company.id}>
							<td>{company.id}</td>
							<td>{company.nombre}</td>
							<td>{company.sector}</td>
							<td>{company.representante?.name || '-'}</td>
							<td>{company.email || '-'}</td>
							<td>{company.telefono || '-'}</td>
							<td>
								<div className="coor-company-actions">
									<button
										type="button"
										className="icon-only"
										onClick={() => handleEditClick(company)}
										aria-label={`Editar empresa ${company.nombre}`}
										title="Editar"
									>
										<EditIcon />
									</button>
									<button
										type="button"
										className="danger icon-only"
										onClick={() => handleDelete(company)}
										aria-label={`Eliminar empresa ${company.nombre}`}
										title="Eliminar"
									>
										<DeleteIcon />
									</button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		)
	}

	return (
		<div className="coor-company-page">
			<DashboardNavbar links={COORDINADOR_LINKS} onLogout={handleLogout} activeIndex={2} />
			<main className="coor-company-main">
				<section className="coor-company-hero">
					<div className="coor-company-hero-copy">
						<p className="coor-company-eyebrow">Administracion</p>
						<h1>Empresas aliadas</h1>
						<p>Consulta y administra la informacion de las empresas vinculadas a LivingLab.</p>
					</div>
					<button
						type="button"
						className="coor-company-create-btn"
						onClick={() => navigate('/coordinador/empresas/crear-empresa')}
					>
						Ir a crear empresa
					</button>
				</section>

				<section className="coor-company-card">
					<div className="coor-company-toolbar">
						<div>
							<h2>Listado de empresas</h2>
							<p>Filtra por nombre, sector, representante o correo.</p>
						</div>

						<label className="coor-company-search">
							<span>Buscar</span>
							<input
								type="search"
								placeholder="Nombre, sector, representante o telefono"
								value={searchValue}
								onChange={(event) => setSearchValue(event.target.value)}
							/>
						</label>
					</div>

					{message ? <div className="coor-company-alert success">{message}</div> : null}
					{error ? <div className="coor-company-alert error">{error}</div> : null}

					<div className="coor-company-table-wrap">{tableContent}</div>
				</section>
			</main>
		</div>
	)
}

export default Empresa
