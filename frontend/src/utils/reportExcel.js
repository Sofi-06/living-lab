function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toCell(value, styleId = 'data') {
  return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`
}

function toRow(values, styleId = 'data') {
  return `<Row>${values.map((value) => toCell(value, styleId)).join('')}</Row>`
}

function buildReportRows(projects, helpers) {
  return projects.map((project) => {
    const companyName = project.company?.nombre ?? 'Sin empresa'
    const projectTitle = project.titulo ?? '-'
    const phases = (project.phaseNames ?? []).length > 0 ? project.phaseNames.join(', ') : 'Sin fases'
    const status = helpers.getStatusLabel(project.estado)
    const startDate = helpers.formatDate(project.fechaInicio)
    const endDate = helpers.formatDate(project.fechaFin)
    const representative = project.company?.representante?.name ?? '-'
    const participant = project.participante?.name ?? '-'
    const evaluator = project.evaluador?.name ?? '-'
    const users = (project.users ?? []).map((user) => user.name).filter(Boolean).join(', ') || '-'

    return [
      companyName,
      projectTitle,
      phases,
      status,
      startDate,
      endDate,
      representative,
      participant,
      evaluator,
      users,
    ]
  })
}

export function downloadReportExcel({
  projects,
  generatedAt,
  fileName,
  getStatusLabel,
  formatDate,
}) {
  const reportRows = buildReportRows(projects, { getStatusLabel, formatDate })

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="title">
   <Font ss:Bold="1" ss:Size="18" ss:Color="#22305A"/>
   <Interior ss:Color="#EAF1FF" ss:Pattern="Solid"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="meta">
   <Font ss:Size="10" ss:Color="#5F6F92"/>
  </Style>
  <Style ss:ID="header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#4460BA" ss:Pattern="Solid"/>
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DFEF"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DFEF"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DFEF"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DFEF"/>
   </Borders>
  </Style>
  <Style ss:ID="data">
   <Alignment ss:Vertical="Top" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E7F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E7F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E7F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E7F0"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Reporte LivingLab">
  <Table>
   <Column ss:Width="140"/>
   <Column ss:Width="180"/>
   <Column ss:Width="180"/>
   <Column ss:Width="95"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="130"/>
   <Column ss:Width="130"/>
   <Column ss:Width="130"/>
   <Column ss:Width="220"/>
   <Row ss:Height="28">${toCell('Reporte', 'title')}${'<Cell/>' .repeat(9)}</Row>
   ${toRow([`Generado: ${generatedAt}`], 'meta')}
   ${toRow(['Total de proyectos incluidos: ' + reportRows.length], 'meta')}
   <Row/>
   ${toRow(['Empresa', 'Proyecto', 'Fases', 'Estado', 'Fecha inicio', 'Fecha fin', 'Representante', 'Participante', 'Evaluador', 'Usuarios'], 'header')}
   ${reportRows.map((row) => toRow(row, 'data')).join('')}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>6</SplitHorizontal>
   <TopRowBottomPane>6</TopRowBottomPane>
   <Panes>
    <Pane>
     <Number>3</Number>
    </Pane>
    <Pane>
     <Number>2</Number>
     <ActiveRow>6</ActiveRow>
    </Pane>
   </Panes>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
