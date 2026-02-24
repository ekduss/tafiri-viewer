// 동일한 데이터 타입 비교
const dataType = 'chl';

// storage 정보
const rustfs_info = {
    "bucket_name": "tz-bucket",
    "folder": "web_viewer_img"
}

// Leaflet 지도 생성
const map = L.map('map').setView([-7.16, 41.25], 7);
map.doubleClickZoom.disable();

// Leaflet 타일 생성
map.createPane('left')
map.createPane('right')
const leftTileLayer = L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', {
    maxZoom: 19,
    crs: L.CRS.EPSG4326,
    pane: 'left'
}).addTo(map);
const rightTileLayer = L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', {
    maxZoom: 19,
    crs: L.CRS.EPSG4326,
    pane: 'right'
}).addTo(map);
L.control.sideBySide(leftTileLayer, rightTileLayer).addTo(map)

$(document).ready(function () {
    getLeafletCustom();
    selectImage();

    // 변경 이벤트 감지
    document.querySelector("#select_left").addEventListener('change', (event) => {
        selectImage(event.target.value, null)
    })

    document.querySelector("#select_right").addEventListener('change', (event) => {
        selectImage(null, event.target.value)
    })

    if(dataType=='chl') {
        getColorbar("colorbar_chl", [0.01, 0.1, 1, 10], "right", "mg/m³")
        $("#colorbar_chl").css("display", "block");
    }
    else {
        getColorbar("colorbar_sst", [25, 26, 27, 28, 29, 30, 31, 32], "right", "℃")
        $("#colorbar_sst").css("display", "block");
    }
});

// custom layer 생성
function getLeafletCustom(){

    // 데이터 드롭다운
    const customLayer = L.control({ position: 'topright' });
    customLayer.onAdd = () => {
        let message = ''
        if (dataType=='chl') message = 'Chl-A 비교'
        else message = 'SST 비교'

        const customDiv = L.DomUtil.create('div');
        customDiv.id = 'layer-menu'
        customDiv.innerHTML = `<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4">
                            <div class="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                                <h3 class="text-lg font-semibold text-gray-800">
                                    ` + message + `
                                </h3>
                            </div>
                            <div class="text-sm bg-white text-right"><span>Left: </span>` + getChlImageOverlay('left') + `</div>
                            <div class="text-sm bg-white text-right py-1"><span>Right: </span>` + getChlImageOverlay('right') + `</div></div>`
        return customDiv;
    }
    customLayer.addTo(map);

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

// 저장된 파일 중 최근 7일 자료 호출
function getChlImageOverlay(pos) {
    let apiResult = ``;
    $.ajax({
        type: "POST",
        url: "https://tzapi.s-dev.ust21.kr/int/v1/storage/objects_recent",
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(rustfs_info),
        async: false,
        success : function(res) {
            let objects = res.objects;
            apiResult = `<select id='select_`+pos+`'>`;
            for(let i=0; i<objects.length; i++){
                let filename = objects[i].FileName;
                if (filename.startsWith(dataType)){
                    let targetName = filename.split('/')[1]
                    targetName  = targetName.split('_web.png')[0]
                    let oneData = `<option value="`+targetName+`">`+targetName+`</option>`
                    apiResult += oneData
                }
            }
            apiResult+=`</select>`
        }
    })

    return apiResult
}

// 선택한 이미지 출력
function selectImage(left, right){
    let selectedLeft = document.querySelector("#select_left").value;
    let selectedRight = document.querySelector("#select_right").value;
    if(left) selectedLeft = left;
    if(right) selectedRight = right;

    const latLngBounds = L.latLngBounds([
        [-10.0, 38.2],
        [-4.8, 43]
    ]);

    let imageLeft = 'https://dl.s-dev.ust21.kr/'+rustfs_info.bucket_name+"/"+rustfs_info.folder+"/"+dataType+"/"+selectedLeft+"_web.png";
    let imageRight = 'https://dl.s-dev.ust21.kr/'+rustfs_info.bucket_name+"/"+rustfs_info.folder+"/"+dataType+"/"+selectedRight+"_web.png";

    resetImageLayer();
    L.imageOverlay(imageLeft, latLngBounds, { pane: 'left' }).addTo(map);
    L.imageOverlay(imageRight, latLngBounds, { pane: 'right' }).addTo(map);
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