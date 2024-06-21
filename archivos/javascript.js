<script>

	
    $(document).ready(function(){
		
		var items = []; // SE USA PARA EL INPUT DE AUTOCOMPLETE
		var table;
		var itemProducto = 1;
		var nro_boleta;
	
	
		/* ======================================================================================
		EVENTO QUE REGISTRA EL PRODUCTO EN EL LISTADO CUANDO SE INGRESA EL CODIGO DE BARRAS
		======================================================================================*/
		$("#iptCodigoVenta").change(function() {
			CargarProductos();        
		});

		/* ======================================================================================
		EVENTO PARA ELIMINAR UN PRODUCTO DEL LISTADO
		======================================================================================*/
		$('#lstProductosVenta tbody').on('click', '.btnEliminarproducto', function() {
			table.row($(this).parents('tr')).remove().draw();
			recalcularTotales();
		});

		/* ======================================================================================
		EVENTO PARA AUMENTAR LA CANTIDAD DE UN PRODUCTO DEL LISTADO
		======================================================================================*/
		$('#lstProductosVenta tbody').on('click', '.btnAumentarCantidad', function() {

			var data = table.row($(this).parents('tr')).data();
			var idx = table.row($(this).parents('tr')).index();

			var codigo_producto = data['codigo_producto'];
			var cantidad = data['cantidad'];

			$.ajax({
				async: false,
				url: "ajax/productos.ajax.php",
				method: "POST",
				data: {
					'tipo_operacion': 5,
					'codigo_producto': codigo_producto,
					'cantidad_a_comprar': cantidad
				},
				dataType: 'json',
				success: function(respuesta) {

					if (parseInt(respuesta[0]) == 0) {

						Toast.fire({
							icon: 'error',
							title: ' El producto ' + data['descripcion_producto'] + ' ya no tiene stock'
						})

						flag_stock = 0;
						$("#iptCodigoVenta").val("");
						$("#iptCodigoVenta").focus();

					} else {

						cantidad = parseInt(data['cantidad']) + 1;

						table.cell(idx, 5).data(cantidad + ' Und(s)').draw();

						NuevoPrecio = (parseInt(data['cantidad']) * data['precio_venta_producto'].replace("S./ ", "")).toFixed(2);
						NuevoPrecio = "S./ " + NuevoPrecio;
						
						table.cell(idx, 7).data(NuevoPrecio).draw();

						recalcularTotales();
						actualizarVuelto();

					}
				}
			});

		});

		/* ======================================================================================
		EVENTO PARA INGRESAR EL PESO DEL PRODUCTO
		======================================================================================*/
		$('#lstProductosVenta tbody').on('click', '.btnIngresarPeso', function() {

			var data = table.row($(this).parents('tr')).data();
			var codigo_producto = data['codigo_producto'];
			var flag_stock = 0;

			flag_stock = 1;

			if (flag_stock == 1) {

				Swal.fire({
					title: "",
					text: "Peso del Producto (Grms):",
					input: 'text',
					width: 300,
					confirmButtonText: 'Aceptar',
					showCancelButton: true,
				}).then((result) => {

					if (result.value) {
						
						cantidad = result.value;

						var idx = table.row($(this).parents('tr')).index();

						table.cell(idx, 5).data(cantidad + ' Kg(s)').draw();

						NuevoPrecio = ((parseFloat(data['cantidad']) * data['precio_venta_producto'].replace("S./ ", "")).toFixed(2));
						NuevoPrecio = "S./ " + NuevoPrecio;

						table.cell(idx, 7).data(NuevoPrecio).draw();

						recalcularTotales();

					}

				});

			}

		});

		/* ======================================================================================
		EVENTO PARA DESMINUIR LA CANTIDAD DE UN PRODUCTO DEL LISTADO
		======================================================================================*/
		$('#lstProductosVenta tbody').on('click', '.btnDisminuirCantidad', function() {

			var data = table.row($(this).parents('tr')).data();

			if (data['cantidad'].replace('Und(s)', '') >= 2) {

				cantidad = parseInt(data['cantidad'].replace('Und(s)', '')) - 1;

				var idx = table.row($(this).parents('tr')).index();

				table.cell(idx, 5).data(cantidad + ' Und(s)').draw();

				NuevoPrecio = (parseInt(data['cantidad']) * data['precio_venta_producto'].replace("S./ ", "")).toFixed(2);
				NuevoPrecio = "S./ " + NuevoPrecio;

				table.cell(idx, 7).data(NuevoPrecio).draw();

			}

			recalcularTotales();
			actualizarVuelto();
		})

		/* ======================================================================================
		EVENTO PARA INICIAR EL REGISTRO DE LA VENTA
		======================================================================================*/
		$("#btnIniciarVenta").on('click', function() {

			var count = 0;
			var totalVenta = $("#totalVenta").html();

			table.rows().eq(0).each(function(index) {
				count = count + 1;
			});

			if (count > 0) {

				if ($("#iptEfectivoRecibido").val() > 0 && $("#iptEfectivoRecibido").val() != "") {

					if ($("#iptEfectivoRecibido").val() < parseFloat(totalVenta)) {
						Toast.fire({
							icon: 'warning',
							title: 'El efectivo es menor al costo total de la venta'
						});

						return false;
					}

					var formData = new FormData();
					var arr = [];

					table.rows().eq(0).each(function(index) {
				   
						var row = table.row(index);

						var data = row.data();

						arr[index] = data['codigo_producto'] + "," + parseFloat(data['cantidad']) + "," + data['total'].replace("S./ ", "");
						formData.append('arr[]', arr[index]);

					})

					formData.append('nro_boleta', nro_boleta);
					formData.append('descripcion_venta', 'Venta realizada con Nro Boleta: ' + nro_boleta);
					formData.append('total_venta', parseFloat(totalVenta));

					$.ajax({
						url: "ajax/ventas.ajax.php",
						method: "POST",
						data: formData,
						cache: false,
						contentType: false,
						processData: false,
						success: function(respuesta) {

							Swal.fire({
								position: 'center',
								icon: 'success',
								title: respuesta,
								showConfirmButton: false,
								timer: 1500
							})

							$("#mdlRegistrarVenta").modal('hide');

							table
								.clear()
								.draw();

							$("#totalVenta").html("0.00");
							$("#totalVentaRegistrar").html("0.00");
							$("#boleta_total").html("0.00");
							$("#boleta_igv").html("0.00");
							$("#boleta_subtotal").html("0.00");                        
							$("#iptEfectivoRecibido").val("");
							$("#EfectivoEntregado").html("0.00");
							$("#Vuelto").html("0.00");
							$("#chkEfectivoExacto").prop('checked', false);
							
							$("#iptCodigoVenta").focus();
							CargarNroBoleta();
						}
					});


				} else {
					Toast.fire({
						icon: 'error',
						title: 'Ingrese el monto en efectivo'
					});
				}

			} else {

				Toast.fire({
					icon: 'error',
					title: 'No hay productos en el listado.'
				});

				$("#iptCodigoVenta").focus();
			}

			$("#iptCodigoVenta").focus();

		})

		/* ======================================================================================
		EVENTO QUE PERMITE CHECKEAR EL EFECTIVO CUANDO ES EXACTO
		=========================================================================================*/
		$("#chkEfectivoExacto").change(function() {

			// alert($("#chkEfectivoExacto").is(':checked'))

			if ($("#chkEfectivoExacto").is(':checked')) {

				var vuelto = 0;
				var totalVenta = $("#totalVenta").html();

				$("#iptEfectivoRecibido").val(totalVenta);


				$("#EfectivoEntregado").html(totalVenta);
				var EfectivoRecibido = parseFloat($("#EfectivoEntregado").html().replace("S./ ", ""));

				vuelto = parseFloat(totalVenta) - parseFloat(EfectivoRecibido);

				$("#Vuelto").html(vuelto.toFixed(2));
			} else {
				$("#iptEfectivoRecibido").val("")
				$("#EfectivoEntregado").html("0.00");
				$("#Vuelto").html("0.00");
			}
		})

		/* ======================================================================================
		EVENTO QUE SE DISPARA AL DIGITAR EL MONTO EN EFECTIVO ENTREGADO POR EL CLIENTE
		=========================================================================================*/
		$("#iptEfectivoRecibido").keyup(function() {
			actualizarVuelto();
		});

		/* ======================================================================================
		EVENTO QUE DISPARÁ EL VACIADO DE LA LISTA DE PRODUCTOS A VENDER
		=========================================================================================*/
		$("#btnVaciarListado").on('click', function() {
			VaciarListado();
		})

		/*===================================================================*/
		//FUNCION PARA RECALCULAR TOTALES CUANDO SE MODIFIQUE ALGUNA CANTIDAD DE PRODUCTO
		/*===================================================================*/
		function recalcularTotales(){

			var TotalVenta = 0.00;

			table.rows().eq(0).each(function(index) {

				var row = table.row(index);
				var data = row.data();

				TotalVenta = parseFloat(TotalVenta) + parseFloat(data['total'].replace("S./ ", ""));

			});

			$("#totalVenta").html("");
			$("#totalVenta").html(TotalVenta.toFixed(2));

			var totalVenta = $("#totalVenta").html();
			var igv = parseFloat(totalVenta) * 0.18
			var subtotal = parseFloat(totalVenta) - parseFloat(igv);

			$("#totalVentaRegistrar").html(totalVenta);
			
			$("#boleta_subtotal").html(parseFloat(subtotal).toFixed(2));
			$("#boleta_igv").html(parseFloat(igv).toFixed(2));
			$("#boleta_total").html(parseFloat(totalVenta).toFixed(2));
			
			$("#iptCodigoVenta").val("");
			$("#iptCodigoVenta").focus();
		}

		/*===================================================================*/
		//FUNCION PARA ACTUALIZAR EL VUELTO CUANDO SE CAMBIE LA CANTIDAD DE ALGUN PRODUCTO
		/*===================================================================*/
		function actualizarVuelto(){
			
			var totalVenta = $("#totalVenta").html();        

			$("#chkEfectivoExacto").prop('checked', false);

			var efectivoRecibido = $("#iptEfectivoRecibido").val();
			
			if (efectivoRecibido > 0) {
				
				$("#EfectivoEntregado").html(parseFloat(efectivoRecibido).toFixed(2));

				vuelto = parseFloat(efectivoRecibido) - parseFloat(totalVenta);

				$("#Vuelto").html(vuelto.toFixed(2));

			} else {

				$("#EfectivoEntregado").html("0.00");
				$("#Vuelto").html("0.00");

			}
		}

		/*===================================================================*/
		//FUNCION PARA CARGAR EL NRO DE BOLETA
		/*===================================================================*/
		function CargarNroBoleta() {
			$.ajax({
				async: false,
				url: "ajax/ventas.ajax.php",
				method: "POST",
				data: {
					'tipo_operacion': 2
				},
				dataType: 'json',
				success: function(respuesta) {
					nro_boleta = respuesta["nro_venta"];
					$("#iptNroSerie").val('B001');
					$("#iptNroVenta").val(respuesta["nro_venta"]);
				}
			});
		}

		/*===================================================================*/
		//FUNCION PARA VACIAR EL LISTADO
		/*===================================================================*/
		function VaciarListado() {
			table.clear().draw();
			LimpiarInputs();
		}//Fin VaciarListado

		/*===================================================================*/
		//FUNCION PARA LIMPIAR LOS INPUTS DE LA BOLETA Y LABELS QUE TIENEN DATOS
		/*===================================================================*/
		function LimpiarInputs() {
			$("#totalVenta").html("0.00");
			$("#totalVentaRegistrar").html("0.00");
			$("#boleta_total").html("0.00");
			$("#iptEfectivoRecibido").val("");
			$("#EfectivoEntregado").html("0.00");
			$("#Vuelto").html("0.00");
			$("#chkEfectivoExacto").prop('checked', false);
		}/* FIN LimpiarInputs */

		/*===================================================================*/
		//FUNCION PARA CARGAR PRODUCTOS EN EL DATATABLE
		/*===================================================================*/
		function CargarProductos(producto = "") {

			if (producto != "") {
				var codigo_producto = producto;
			} else {
				var codigo_producto = $("#iptCodigoVenta").val();
			}

			var existe = 0;
			var codigo_repetido;
			var NuevoPrecio = 0;
			var TotalVenta = 0;
			var flag_stock = 1;

			/*===================================================================*/
			// VERIFICAMOS QUE EL PRODUCTO TENGA STOCK CUANDO ESTA EN EL LISTADO
			/*===================================================================*/
			table.rows().eq(0).each(function(index) {

				var row = table.row(index);
				var data = row.data();

				if (parseInt(codigo_producto) == data['codigo_producto']) {

					existe = 1;
					codigo_repetido = parseInt(data['codigo_producto']);

					$.ajax({
						async: false,
						url: "ajax/productos.ajax.php",
						method: "POST",
						data: {
							'tipo_operacion': 5,
							'codigo_producto': data['codigo_producto'],
							'cantidad_a_comprar': data['cantidad']
						},
						dataType: 'json',
						success: function(respuesta) {

							if (parseInt(respuesta[0]) == 0) {
			
								Toast.fire({
									icon: 'error',
									title: ' El producto ' + data['descripcion_producto'] + ' ya no tiene stock'
								})

								flag_stock = 0;
								$("#iptCodigoVenta").val("");
								$("#iptCodigoVenta").focus();
								
								return;

							} else {
								flag_stock = 1;
							}
						}
					});
				}
			});			


			/*============================================================================
			SI EL PRODUCTO TIENE STOCK
			============================================================================*/
			if (parseInt(flag_stock) == 1) {

				/*============================================================================
				SI EL PRODUCTO ESTÁ REGISTRADO EN EL LISTADO DE VENTAS
				============================================================================*/
				if (existe == 1) {

					table.rows().eq(0).each(function(index) {

						var row = table.row(index);

						var data = row.data();

						if (data['codigo_producto'] == codigo_repetido) {

							// AUMENTAR EN 1 EL VALOR DE LA CANTIDAD
							table.cell(index, 5).data(parseInt(data['cantidad']) + 1 + ' Und(s)').draw();

							// ACTUALIZAR EL NUEVO PRECIO DEL ITEM DEL LISTADO DE VENTA
							NuevoPrecio = (parseInt(data['cantidad']) * data['precio_venta_producto'].replace("S./ ", "")).toFixed(2);
							NuevoPrecio = "S./ " + NuevoPrecio;
							table.cell(index, 7).data(NuevoPrecio).draw();

							// RECALCULAMOS TOTALES
							recalcularTotales();

						}

					});


				/*============================================================================
				SI EL PRODUCTO NO ESTÁ REGISTRADO EN EL LISTADO DE VENTAS
				============================================================================*/
				} else {

					$.ajax({
						url: "ajax/productos.ajax.php",
						method: "POST",
						data: {
							'tipo_operacion': 2,
							'codigo_producto': codigo_producto
						},
						dataType: 'json',
						success: function(respuesta) {
							
							/*===================================================================*/
							//SI LA RESPUESTA ES VERDADERO, TRAE ALGUN DATO
							/*===================================================================*/
							if (respuesta) {

								var TotalVenta = 0.00;

								console.log("respuesta",respuesta)

								if (respuesta['aplica_peso'] == 1) {
								
									table.row.add({
										'id': itemProducto,
										'codigo_producto': respuesta['codigo_producto'],
										'id_categoria': respuesta['id_categoria'],
										'nombre_categoria': respuesta['nombre_categoria'],
										'descripcion_producto': respuesta['descripcion_producto'],
										'cantidad': respuesta['cantidad'] + ' Kg(s)',
										'precio_venta_producto': respuesta['precio_venta_producto'],
										'total' : respuesta['total'],
										'acciones': "<center>" +
										"<span class='btnIngresarPeso text-success px-1' style='cursor:pointer;' data-bs-toggle='tooltip' data-bs-placement='top' title='Aumentar Stock'> " +
										"<i class='fas fa-balance-scale fs-5'></i> " +
										"</span> " +
										"<span class='btnEliminarproducto text-danger px-1'style='cursor:pointer;' data-bs-toggle='tooltip' data-bs-placement='top' title='Eliminar producto'> " +
										"<i class='fas fa-trash fs-5'> </i> " +
										"</span>" +
										"</center>",
										'aplica_peso': respuesta['aplica_peso']
									}).draw();

									itemProducto = itemProducto + 1;

								} else {

									table.row.add({
										'id': itemProducto,
										'codigo_producto': respuesta['codigo_producto'],
										'id_categoria': respuesta['id_categoria'],
										'nombre_categoria': respuesta['nombre_categoria'],
										'descripcion_producto': respuesta['descripcion_producto'],
										'cantidad': respuesta['cantidad'] + ' Und(s)',
										'precio_venta_producto': respuesta['precio_venta_producto'],
										'total' : respuesta['total'],
										'acciones': "<center>" +
														"<span class='btnAumentarCantidad text-success px-1' style='cursor:pointer;' data-bs-toggle='tooltip' data-bs-placement='top' title='Aumentar Stock'> " +
														"<i class='fas fa-cart-plus fs-5'></i> " +
														"</span> " +
														"<span class='btnDisminuirCantidad text-warning px-1' style='cursor:pointer;' data-bs-toggle='tooltip' data-bs-placement='top' title='Disminuir Stock'> " +
														"<i class='fas fa-cart-arrow-down fs-5'></i> " +
														"</span> " +
														"<span class='btnEliminarproducto text-danger px-1'style='cursor:pointer;' data-bs-toggle='tooltip' data-bs-placement='top' title='Eliminar producto'> " +
														"<i class='fas fa-trash fs-5'> </i> " +
														"</span>" +
													"</center>",
										'aplica_peso': respuesta['aplica_peso']
									}).draw();

									itemProducto = itemProducto + 1;

								}

								//  Recalculamos el total de la venta
								recalcularTotales();
								actualizarVuelto();

							/*===================================================================*/
							//SI LA RESPUESTA ES FALSO, NO TRAE ALGUN DATO
							/*===================================================================*/
							} else {
								Toast.fire({
									icon: 'error',
									title: ' El producto no existe o no tiene stock'
								});

								$("#iptCodigoVenta").val("");
								$("#iptCodigoVenta").focus();
							}

						}
					});

				}

			}
			
			$("#iptCodigoVenta").val("");
			$("#iptCodigoVenta").focus();

		}/* FIN CargarProductos */
    })

</script>