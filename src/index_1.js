// storage 정보
const rustfs_info = {
    "bucket_name": "tz-bucket",
    "folder": "web_viewer_img"
}

// Leaflet 지도 생성
const map = L.map('map').setView([-7.16, 41.25], 7);
L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', {
    maxZoom: 19,
    crs: L.CRS.EPSG4326
}).addTo(map);
map.doubleClickZoom.disable();

$(document).ready(function () {
    getLeafletCustom()

    $(".item-selected").click(function (){
        let item = $(this).val();

        if (item == 'Chl-A') {
            selectItem('chl');
        } else if (item == 'SST') {
            selectItem('sst');
        } else {
            selectItem('');
        }
    });

    $(".data-selected").click(function(){
        let pngName = $(this).val();
        getImageOverlay(pngName);
    })

    getColorbar("colorbar_chl", [0.01, 0.1, 1, 10], "right", "mg/m³")
    getColorbar("colorbar_sst", [25, 26, 27, 28, 29, 30, 31, 32], "right", "℃")
});

// custom layer 생성
function getLeafletCustom(){

    // 데이터 리스트
    const customLayer = L.control();
    customLayer.onAdd = () => {
        const customDiv = L.DomUtil.create('div');
        customDiv.id = 'layer-dataList'
        return customDiv;
    }
    customLayer.addTo(map);
    const dataList = document.getElementById("layer-dataList");
    dataList.insertAdjacentHTML("afterbegin", getDataList());

    // 컬러바
    const customColorbar = L.control({ position: 'bottomright' });
    customColorbar.onAdd = () => {
        const colorbarDiv = L.DomUtil.create('div', 'colorbar-wrapper');
        colorbarDiv.innerHTML = `
            <canvas class="colorbar" id="colorbar_chl" width="200px" height="380px" style="display: none;"></canvas>
            <canvas class="colorbar" id="colorbar_sst" width="200px" height="380px" style="display: none;"></canvas>
        `
        return colorbarDiv
    }
    customColorbar.addTo(map)
}

function getDataList(){
    return `
    <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 sm:px-6">
        <div class="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 class="text-lg font-semibold text-gray-800">
                TAFIRI-test
            </h3>
        </div>

        <div class="flex items-center gap-3 pb-5">
            <input type="button" class="item-selected inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:bg-gray-300 hover:text-gray-800"
                value="All"/>
            <input type="button" class="item-selected inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:bg-gray-300 hover:text-gray-800"
                value="Chl-A"/>
            <input type="button" class="item-selected inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:bg-gray-300 hover:text-gray-800"
                value="SST"/>
        </div>

        <div class="w-full overflow-x-auto custom-height">
            <table class="min-w-full">
                <tbody class="divide-y divide-gray-100 h-32">`+getApiData()+`</tbody>
            </table>
        </div>
    </div>`
}

// 저장된 파일 중 최근 7일 자료 호출
function getApiData(){
    let apiResult = ``;
    $.ajax({
        type: "POST",
        url: "https://tzapi.s-dev.ust21.kr/int/v1/storage/objects_recent",
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(rustfs_info),
        async: false,
        success : function(res){
            let objects = res.objects;
            for(let i=0; i<objects.length; i++){
                let filename = objects[i].FileName;
                let item = filename.split('/')[0];
                let data = filename.split('/')[1];

                let oneData = `
                <tr class="datalist `+item+`">
                    <td class="py-3 flex items-center gap-3">
                        <input type="checkbox" class="data-selected" id="`+filename+`" value="`+filename+`" hidden>
                        <label class="font-medium text-gray-800 text-xs hover:text-red-500" for="`+filename+`">
                            `+data+`
                        </label>
                    </td>
                </tr>
                `
                apiResult += oneData
            }
        }
    })

    return apiResult
}

// 데이터 항목 별 리스트 출력
function selectItem(selected){
    let dataListAll = document.getElementsByClassName("datalist");
    for (let i=0; i<dataListAll.length; i++) {
        let className = dataListAll[i].className;
        if(className.endsWith(selected)){
            dataListAll[i].style.display = 'block';
        } else {
            dataListAll[i].style.display = 'none';
        }

    }
}

// 이미지 출력
function getImageOverlay(pngName){
    let imgUrl = "https://dl.s-dev.ust21.kr/"+rustfs_info.bucket_name+"/"+rustfs_info.folder+"/"+pngName;
    const latLngBounds = L.latLngBounds([
        [-10.0, 38.2],
        [-4.8, 43]
    ]);

    resetImageLayer()
    L.imageOverlay(imgUrl, latLngBounds, {
        opacity: 1,
        interactive: true
    }).addTo(map)
    .on('click', function(e){
        let lat = e.latlng.lat.toFixed(4);
        let lon = e.latlng.lng.toFixed(4);
        let dataType = pngName.split('/')[0];
        let ncName = pngName.split('/')[1];
        ncName = ncName.replace("_web.png",".nc")

        let folder;
        if (dataType == 'sst') folder='sst_test'
        else folder='chl'

        let requestParam = {
            'bucket_name':rustfs_info.bucket_name,
            'folder':folder,
            'img_name':ncName,
            'lat':lat,
            'lon':lon
        }

        let redMarker = L.AwesomeMarkers.icon({
            prefix: 'bi',
            icon: 'bi-patch-check',
            markerColor: 'red'
        });

        $.ajax({
            type: "POST",
            url: "https://tzapi.s-dev.ust21.kr/int/v1/storage/objects_point",
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(requestParam),
            success: function(res){
                let popupDiv = `
                <span>[lat] ${lat}</span><br>
                <span>[lon] ${lon}</span><br>
                <span style="color:red; font-weight: bolder;">[${dataType}] ${res.result}</span>
                `
                
                let marker = L.marker([lat, lon], {icon: redMarker})
                    .addTo(map)
                    .bindPopup(popupDiv)
                    .openPopup();

                marker.on('contextmenu', function(e) {
                    map.removeLayer(marker);
                });
            } 
        })
    })

    diplayColorbar()
}

// 출력된 위성영상 이미지 초기화
function resetImageLayer(){
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }

        let checkUrl = layer._url;
        if (checkUrl && checkUrl.search('google') == -1) {
            layer.remove();
        }
    });
}

// 데이터 항목 별 컬러바 출력
function diplayColorbar(){
    let lastLayer;
    map.eachLayer((layer) => {
        let url = layer._url
        if (url && url.indexOf('google') == -1) {
            let imgName = url.split('/')
            imgName = imgName[imgName.length - 1]
            lastLayer = imgName
        }
    })

    $(".colorbar").css("display", "none");
    if (lastLayer) {
        let itemName = '';
        if(lastLayer.includes('Chla')) itemName = 'chl'
        else if(lastLayer.includes('OISST')) itemName = 'sst'
        $("#colorbar_" + itemName).css("display", "block");
    }
}